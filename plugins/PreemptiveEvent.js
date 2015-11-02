//==============================================================================
// ** Preemptive-Surprise Event Battle
// by: Jeneeus Guruman
//==============================================================================

var Jene = Jene || {};

/*:
 * @plugindesc Preemptive-Surprise Event Battle v1.1.0
 * @author Jeneeus Guruman
 *
 * @param preemptiveSideChance
 * @desc Chances by percentage on having preemptive when attacking sides. Negative numbers will use the default formula.
 * @default -1
 *
 * @param surprisedSideChance
 * @desc Chances by percentage on having surprised when attacking sides. Negative numbers will use the default formula.
 * @default -1
 *
 * @param preemptiveSurpriseSwitch
 * @desc Enable to use this plugin. 0 value makes it always enabled. Negative values disables instead.
 * @default 0
 *
 * @param preemptiveSurpriseTag
 * @desc The note tag of the event that will enable to use the preemptive-surprise function.
 * @default <enemy>
 *
 * @param stopEvent
 * @desc Enable to stop movements while the current event runs.
 * 0 = disable; -1 = tagged events; -2 = all; 1+ = switch #
 * @default -1
 *
 * @help
 *
 *     This plugin allows to make evented encounters have preemptive and 
 *   surprise encounters.
 *
 *   How to use:
 *
 *     * Plug-n-play
 *     * Not compatible and has problems with the following:
 *       - Any 8-directional movement plugins
 *       - Any pixel movement plugins
 *     * Not recommended if followers are enabled.
 *     * "Encounter Half" and "Encounter None" party abilities do not work 
 *     for evented encounters but "Raise Preemptive" and "Cancel Surprise" 
 *     does work.
 *
 *   Changelog:
 *
 *     * v1.1.1: Renamed parameters to be readable easily.
 *     * v1.1.0: Added "stopEvent" parameter to help stop events from 
 *     moving while the current event is running.
 */

parameters = PluginManager.parameters('PreemptiveEvent');

Jene.preemptiveSideChance = Number(parameters['preemptiveSideChance']);
Jene.surprisedSideChance = Number(parameters['surprisedSideChance']);
Jene.preemptiveSurpriseSwitch = Number(parameters['preemptiveSurpriseSwitch']);
Jene.preemptiveSurpriseTag = String(parameters['preemptiveSurpriseTag']);
Jene.stopEvent = Number(parameters['stopEvent']); 

Jene.battleManagerOnEncounter = BattleManager.onEncounter;

BattleManager.onEncounter = function() {
    var psbeEnable = true;
    if (Jene.preemptiveSurpriseSwitch > 0) {
      psbeEnable = $gameSwitches.value(Jene.preemptiveSurpriseSwitch);
    }
    else if (Jene.preemptiveSurpriseSwitch < 0) {
      psbeEnable = !$gameSwitches.value(Jene.preemptiveSurpriseSwitch * -1);
    }
    if (psbeEnable) {
      this._preemptive = $gameTemp.psNum.call($gameTemp) > 0;
      this._surprise = $gameTemp.psNum.call($gameTemp) < 0;
  	}
    else {
      Jene.battleManagerOnEncounter.call(this);
    }
};

Jene.battleManagerUpdateBattleEnd = BattleManager.updateBattleEnd;

BattleManager.updateBattleEnd = function() {
	$gameTemp.setPsNum.call(0);
	Jene.battleManagerUpdateBattleEnd.call(this);
};

Jene.gameTempPreemptiveInitalize = Game_Temp.prototype.initialize;

Game_Temp.prototype.initialize = function() {
    Jene.gameTempPreemptiveInitalize.call(this);
    this._psNum = 0;
};

Game_Temp.prototype.psNum = function() {
    return this._psNum;
};

Game_Temp.prototype.setPsNum = function(psNum) {
    this._psNum = psNum;
};

Jene.gameCharacterBaseInitMembers = Game_CharacterBase.prototype.initMembers;

Game_CharacterBase.prototype.initMembers = function() {
	Jene.gameCharacterBaseInitMembers.call(this);
    this._prevDirection = 2;
};

Game_CharacterBase.prototype.x = function() {
    return this._x;
};

Game_CharacterBase.prototype.y = function() {
    return this._y;
};

Game_CharacterBase.prototype.prevDirection = function() {
    return this._prevDirection;
};

Jene.gameCharacterBaseSetDirection = Game_CharacterBase.prototype.setDirection;

Game_CharacterBase.prototype.setDirection = function(d) {
  if (!this.isDirectionFixed() && this._direction !== 0) {
    this._prevDirection = this._direction;
  }
	Jene.gameCharacterBaseSetDirection.call(this, d);
};

Jene.gameEventUpdateSelfMovement = Game_Event.prototype.updateSelfMovement;

Game_Event.prototype.updateSelfMovement = function() {
  var disableMove = false;
  switch (Jene.stopEvent) {
  case -2:
    disableMove = $gameMap.isEventRunning();
    break;
  case -1:
    disableMove = $gameMap.isEventRunning() && this.event().note.indexOf(Jene.preemptiveSurpriseTag) >= 0;
    break;
  case 0:
    disableMove = false;
    break;
  default:
    disableMove = $gameSwitches.value(Jene.stopEvent);
    break;
  }
  if (!disableMove) {
    Jene.gameEventUpdateSelfMovement.call(this);
  }
};

Jene.gameInterpreterCommand301 = Game_Interpreter.prototype.command301;

Game_Interpreter.prototype.command301 = function() {
	var psbeEnable = true;
	if (Jene.preemptiveSurpriseSwitch > 0) {
		psbeEnable = $gameSwitches.value(Jene.preemptiveSurpriseSwitch);
	}
	else if (Jene.preemptiveSurpriseSwitch < 0) {
		psbeEnable = $gameSwitches.value(Jene.preemptiveSurpriseSwitch * -1);
	}
	if (psbeEnable) {
	    if (!$gameParty.inBattle()) {
	        var troopId;
	        if (this._params[0] === 0) {  // Direct designation
	            troopId = this._params[1];
	        } else if (this._params[0] === 1) {  // Designation with a variable
	            troopId = $gameVariables.value(this._params[1]);
	        } else {  // Same as Random Encounter
	            troopId = $gamePlayer.makeEncounterTroopId();
	        }
	        if ($dataTroops[troopId]) {
	        	  this.preemptiveOrSurprise();
	            BattleManager.setup(troopId, this._params[2], this._params[3]);
	            BattleManager.setEventCallback(function(n) {
	                this._branch[this._indent] = n;
	            }.bind(this));
              BattleManager.onEncounter();
	            SceneManager.push(Scene_Battle);
	        }
	    }
	}
	else {
		Jene.gameInterpreterCommand301.call(this);
	}
    return true;
};

Game_Interpreter.prototype.preemptiveOrSurprise = function() {
    var enemy = this.character(0);
    var player = this.character(-1);
    var enemyEvent = enemy.event.call(this);
    var playerDirection = player.direction.call(player);
    var playerPrevDirection = player.prevDirection.call(player);
    var enemyDirection = enemy.direction.call(enemy);
    var enemyPrevDirection = enemy.prevDirection.call(enemy);
    if (enemyEvent.note.indexOf(Jene.preemptiveSurpriseTag) >= 0) {
      if (playerDirection === enemyPrevDirection) {
        switch (playerDirection) {
        case 2:
          if (player.y < enemy.y) { 
            $gameTemp.setPsNum(1);
          }
          break;
        case 4:
          if (player.x > enemy.x) {
            $gameTemp.setPsNum(1);
          }
          break;
        case 6:
          if (player.x < enemy.x) {
            $gameTemp.setPsNum(1); 
          }
          break;
        case 8:
          if (player.y > enemy.y) {
            $gameTemp.setPsNum(1); 
          }
          break;
        }
      }
      if (playerDirection === enemyDirection && !$gameParty.hasCancelSurprise.call($gameParty)) {
        switch (enemyDirection) {
        case 2:
          if (enemy.y < player.y) {
            $gameTemp.setPsNum(-1); 
          }
          break;
        case 4:
          if (enemy.x > player.x) {
            $gameTemp.setPsNum(-1); 
          }
          break;
        case 6:
          if (enemy.x < player.x) {
            $gameTemp.setPsNum(-1); 
          }
          break;
        case 8:
          if (enemy.y > player.y) {
            $gameTemp.setPsNum(-1); 
          }
          break;
        }
      }
      if (10 - playerDirection !== enemyPrevDirection) {
        var chance = false;
        if (Jene.preemptiveSideChance < 0) {
          chance = Math.random() < $gameParty.ratePreemptive();
        }
        else {
          chance = Math.random() < (Jene.preemptiveSideChance * ($gameParty.hasRaisePreemptive() ? 4 : 1)) / 100.0;
        }
        switch (playerDirection) {
        case 2:
          if (player.y < enemy.y && chance) {
            $gameTemp.setPsNum(1);
            break;
          }
        case 4:
          if (player.x > enemy.x && chance) {
            $gameTemp.setPsNum(1);
            break;
          }
        case 6:
          if (player.x < enemy.x && chance) {
            $gameTemp.setPsNum(1);
            break;
          }
        case 8:
          if (player.y > enemy.y && chance) {
            $gameTemp.setPsNum(1);
            break;
          }
        }
      }
      if (10 - enemyDirection !== playerDirection && !$gameParty.hasCancelSurprise.call($gameParty)) {
        var chance = false;
        if (Jene.surprisedSideChance < 0) {
          chance = Math.random() < $gameParty.rateSurprise();
        }
        else {
          chance = Math.random() < Jene.surprisedSideChance / 100.0;
        }
        switch (enemyDirection) {
        case 2:
          if (player.y > enemy.y && chance) {
            $gameTemp.setPsNum(-1);
            break;
          }
        case 4:
          if (player.x < enemy.x && chance) {
            $gameTemp.setPsNum(-1);
            break;
          }
        case 6:
          if (player.x > enemy.x && chance) {
            $gameTemp.setPsNum(-1);
            break;
          }
        case 8:
          if (player.y < enemy.y && chance) {
            $gameTemp.setPsNum(-1);
            break;
          }
        }
      }
    }
  };