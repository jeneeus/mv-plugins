//==============================================================================
// ** Change Graphic
// by: Jeneeus Guruman
//------------------------------------------------------------------------------

var Imported = Imported || {};
var Jene = Jene || {};

/*:
 * @plugindesc Change Graphic v1.2.2
 * @author Jeneeus Guruman
 *
 * @param changeDefaultGraphic
 * @desc Enable changes of default graphics if changed using "Change Actor Graphic" command.
 * @default true
 *
 * @param changeDefaultGraphicSwitch
 * @desc Switch to activate default graphic changes. 0 value makes it always enabled. 
 * @default 0
 *
 * @param priorityEquip
 * @desc The order of the equipment to be applied on changes, 
 * separated by spaces and arranged by "Equipment Types".
 * @default 1 5 4 3 2
 *
 * @help
 *
 *     This plugin allows to change sprite and face graphics depending on 
 *   the state, armor, weapon, and class.
 *   
 *   How to use:
 *
 *     To use this, you need to put the following notetags:
 *
 *       To change sprites:
 *
 *       <ge: actor_id, sprite_name, sprite_index>
 *
 *       actor_id: The ID of the actor to be change graphics.
 *       sprite_name: The filename of the sprite graphic to be placed.
 *       sprite_index: The index of the sprite graphic to be placed.
 *
 *       To change face:
 *
 *       <fe: actor_id, face_name, face_index>
 *
 *       actor_id: The ID of the actor to be change face.
 *       face_name: The filename of the face graphic to be placed.
 *       face_index: The index of the face graphic to be placed.
 *
 *       To change sideview sprites:
 *
 *       <sve: [-]battler_id, sideview_name>
 *
 *       battler_id: The ID of the actor to be change sideview graphics.
 *       Placing a negative sign will call the enemy instead.
 *       sideview_name: The filename of the sideview graphic to be placed.
 *
 *       To change weapon animations:
 *
 *       <ae: battler_id, animationId, weaponSlot>
 *
 *       battler_id: The ID of the battler to be change sideview graphics.
 *       Putting 0 instead will affect all actors inflicted.
 *       animationId: The ID of the animation.
 *       weaponSlot: The slot in the weapon to be changed the animation.
 *
 *       Notes: 
 *       * If you use a single-sprite file (files with $ at the beginning), 
 *       you may also add it but the index must be 0.
 *       * If the notetag is not fit in a single line, shorten the filename 
 *       or use the other method below.
 *       * You may put many notetags for the different actors at the 
 *       same equipment.
 *       * The priority on the changes in graphics starting from the highest 
 *       priority are states, equipment, and classes.
 *       * The priority in "priorityEquip" is arranged from the highest 
 *       priority to the lowest.
 *       * "ae" tag only works on states.
 *       * The actor sideview battler image to be changed must be in 
 *       "sv_actors" folder while the enemy must be in "sv_enemies".
 *
 *   Changelog:
 *
 *     * v1.2.2: Now compatible with Yanfly Item Core.
 *     * v1.2.1: Will now load all possible sideview battler changes at the 
 *     start of the battle to remove the blinking bug.
 *     * v1.2.0: Now enemies can be change their battler images.
 *     * v1.1.0: Added "ae" tag to also change weapon animations depending on 
 *     the actor's state.
 */

parameters = PluginManager.parameters('ChangeGraphic');

Jene.changeDefaultGraphic = Boolean(parameters['changeDefaultGraphic']);
Jene.changeDefaultGraphicSwitch = Number(parameters['changeDefaultGraphicSwitch']);
Jene.priorityEquip = String(parameters['priorityEquip']);

if (Imported.YEP_ItemCore) {

Jene.YEPItemManagerSetNewINdependentItem = ItemManager.setNewIndependentItem;

ItemManager.setNewIndependentItem = function(baseItem, newItem) {
    Jene.YEPItemManagerSetNewINdependentItem.call(this, baseItem, newItem);
    newItem.note = baseItem.note;
};

}

Game_Actor.prototype.getAnimationChange = function(item, slotId) {
    var re = /<ae[:]?\s*(\d+)\s*[,]?\s*(\d+)?\s*[,]?\s*(\d+)?\s*>/gi;
    do {
        var match = re.exec(item.note);
        if (match && (match[1] == this._actorId || match[1] == 0) && match[3] == slotId) {
          return match[2];
        }
    } while (match);
    return 0;
};

Jene.gameActorsAttackAnimationId1 = Game_Actor.prototype.attackAnimationId1;

Game_Actor.prototype.attackAnimationId1 = function() {
    var weapons = this.weapons();
    var states = this.states();
    for (var i = 0; i < states.length; i++) {
      var animationId = this.getAnimationChange(states[i], 1);
      if (animationId) {
        return animationId;
      }
    }
    return Jene.gameActorsAttackAnimationId1.call(this);
};

Jene.gameActorsAttackAnimationId2 = Game_Actor.prototype.attackAnimationId2;

Game_Actor.prototype.attackAnimationId2 = function() {
    var weapons = this.weapons();
    var states = this.states();
    states.reverse();
    for (var i = 0; i < states.length; i++) {
      var animationId = this.getAnimationChange(states[i], 2);
      if (animationId) {
        return animationId;
      }
    }
    return Jene.gameActorsAttackAnimationId2.call(this);
};

Jene.gameActorInitMembers = Game_Actor.prototype.initMembers;

Game_Actor.prototype.initMembers = function() {
  Jene.gameActorInitMembers.call(this);
  this._defaultCharacterName = '';
  this._defaultCharacterIndex = 0
  this._defaultFaceName = '';
  this._defaultFaceIndex = 0;
  this._defaultBattlerName = '';
};

Jene.gameActorInitImages = Game_Actor.prototype.initImages;

Game_Actor.prototype.initImages = function() {
    Jene.gameActorInitImages.call(this);
    var actor = this.actor();
    this._defaultCharacterName = actor.characterName;
    this._defaultCharacterIndex = actor.characterIndex;
    this._defaultFaceName = actor.faceName;
    this._defaultFaceIndex = actor.faceIndex;
    this._defaultBattlerName = actor.battlerName;
};

Jene.gameActorChangeEquip = Game_Actor.prototype.changeEquip;

Game_Actor.prototype.changeEquip = function(slotId, item) {
    Jene.gameActorChangeEquip.call(this, slotId, item);
    this.refreshGraphicEquip();
    $gamePlayer.refresh();
};

Jene.gameActorChangeClass = Game_Actor.prototype.changeClass;

Game_Actor.prototype.changeClass = function(classId, keepExp) {
    Jene.gameActorChangeClass.call(this, classId, keepExp);
    this.refreshGraphicEquip();
    $gamePlayer.refresh();
};

Jene.gameActorAddNewState = Game_Actor.prototype.addNewState;

Game_Actor.prototype.addNewState = function(stateId) {
    Jene.gameActorAddNewState.call(this, stateId);
    this.refreshGraphicEquip();
    $gamePlayer.refresh();
};

Jene.gameActorEraseState = Game_Actor.prototype.eraseState;

Game_Actor.prototype.eraseState = function(stateId) {
    Jene.gameActorEraseState.call(this, stateId);
    this.refreshGraphicEquip();
    $gamePlayer.refresh();
};

Jene.gameActorClearStates = Game_Actor.prototype.clearStates;

Game_Actor.prototype.clearStates = function() {
    Jene.gameActorClearStates.call(this);
    this.refreshGraphicEquip();
    $gamePlayer.refresh();
};

Game_Actor.prototype.setDefaultCharacterImage = function(characterName, characterIndex) {
    this._defaultCharacterName = characterName;
    this._defaultCharacterIndex = characterIndex;
};

Game_Actor.prototype.setDefaultFaceImage = function(faceName, faceIndex) {
    this._defaultFaceName = faceName;
    this._defaultFaceIndex = faceIndex;
};

Game_Actor.prototype.setDefaultBattlerImage = function(battlerName) {
    this._defaultBattlerName = battlerName;
};

Game_Actor.prototype.getCharacterChange = function(item) {
    var re = /<ge[:]?\s*(\d+)\s*[,]?\s*([$]*\w+)?\s*[,]?\s*(\d+)\s*>/gi;
    do {
        var match = re.exec(item.note);
        if (match && match[1] == this._actorId) {
          return {name: match[2], index: match[3]};
        }
    } while (match);
    return;
};

Game_Actor.prototype.getFaceChange = function(item) {
    var re = /<fe[:]?\s*(\d+)\s*[,]?\s*([$]*\w+)?\s*[,]?\s*(\d+)\s*>/gi;
    do {
        var match = re.exec(item.note);
        if (match && match[1] == this._actorId) {
          return {name: match[2], index: match[3]};
        }
    } while (match);
    return;
};

Game_Actor.prototype.getBattlerChange = function(item) {
    var re = /<sve[:]?\s*(\d+)\s*[,]?\s*([$]*\w+)?\s*>/gi;
    do {
        var match = re.exec(item.note);
        if (match && match[1] == this._actorId) {
          return match[2];
        }
    } while (match);
    return;
};

Game_Actor.prototype.graphicEquip = function(item) {
    if (this.getCharacterChange(item)) {
      this.setCharacterImage(this.getCharacterChange(item).name, this.getCharacterChange(item).index);
    }
};

Game_Actor.prototype.faceEquip = function(item) {
    if (this.getFaceChange(item)) {
      this.setFaceImage(this.getFaceChange(item).name, this.getFaceChange(item).index);
    }
};

Game_Actor.prototype.graphicSideviewEquip = function(item) {
    if (this.getBattlerChange(item)) {
      this.setBattlerImage(this.getBattlerChange(item));
    }
};

Game_Actor.prototype.refreshGraphicEquip = function() {
    if (!(this.currentClass() && this.equips() && this.states())) {
      return;
    }
    this.setCharacterImage(this._defaultCharacterName, this._defaultCharacterIndex);
    this.setFaceImage(this._defaultFaceName, this._defaultFaceIndex);
    this.setBattlerImage(this._defaultBattlerName);
    if (this.currentClass().meta.ge !== undefined) {
      this.graphicEquip(this.currentClass());
    }
    if (this.currentClass().meta.fe !== undefined) {
      this.faceEquip(this.currentClass());
    }
    if (this.currentClass().meta.sve !== undefined) {
      this.graphicSideviewEquip(this.currentClass());
    }
    var equipsSort = Jene.priorityEquip.split(" ");
    for (var i = 0; i < equipsSort.length; i++) {
      equipsSort[i] = parseInt(equipsSort[i]);
    }
    var equips = this.equips().filter(function (equip) {
      return equip;
    });
    equips.sort(function (a, b) {
      return equipsSort.indexOf(b.etypeId) - equipsSort.indexOf(a.etypeId);
    });
    for (var i = 0; i < equips.length; i++) { 
      if (equips[i].meta.ge !== undefined) {
        this.graphicEquip(equips[i]);
      }
      if (equips[i].meta.fe !== undefined) {
        this.faceEquip(equips[i]);
      }
      if (equips[i].meta.sve !== undefined) {
        this.graphicSideviewEquip(equips[i]);
      }
    }
    var states = this.states();
    states.reverse();
    for (var i = 0; i < states.length; i++) {
      if (states[i].meta.ge !== undefined) {
        this.graphicEquip(states[i]);
      }
      if (states[i].meta.fe !== undefined) {
        this.faceEquip(states[i]);
      }
      if (states[i].meta.sve !== undefined) {
        this.graphicSideviewEquip(states[i]);
      }
    }
};

Jene.gameEnemyBattlername = Game_Enemy.prototype.battlerName;

Game_Enemy.prototype.battlerName = function() {
    var states = this.states();
    var name = "";
    for (var i = 0; i < states.length; i++) {
      var re = /<sve[:]?\s*[-](\d+)\s*[,]?\s*([$]*\w+)?\s*>/gi;
      do {
        var match = re.exec(states[i].note);
        if (match && match[1] == this._enemyId) {
          name = match[2];
        }
      } while (match);
    }
    if (name === "") {
      name = Jene.gameEnemyBattlername.call(this);
    }
    return name;
};

Jene.gamePartySetupStartingMembers = Game_Party.prototype.setupStartingMembers;

Game_Party.prototype.setupStartingMembers = function() {
    Jene.gamePartySetupStartingMembers.call(this);
    this.refreshGraphic();
};

Game_Party.prototype.refreshGraphic = function() {
    for (var i = 0; i < this.members().length; i++) {
      this.members()[i].refreshGraphicEquip();
    }
};

Jene.gameInterpreterCommand322 = Game_Interpreter.prototype.command322;

Game_Interpreter.prototype.command322 = function() {
    var actor = $gameActors.actor(this._params[0]);
    if (actor && Jene.changeDefaultGraphic && ($gameSwitches.value(Jene.changeDefaultGraphicSwitch) || Jene.changeDefaultGraphicSwitch === 0)) {
        actor.setCharacterImage(this._params[1], this._params[2]);
        actor.setFaceImage(this._params[3], this._params[4]);
        actor.setBattlerImage(this._params[5]);
    }
    $gamePlayer.refresh();
    return Jene.gameInterpreterCommand322.call(this);
};

Jene.spriteBattlerInitialize = Sprite_Battler.prototype.initialize;

Sprite_Battler.prototype.initialize = function(battler) {
  $dataStates.forEach(function(state) {
      if (!state || !state.meta.sve) { return; }
        var re = /<sve[:]?\s*([-]?\d+)\s*[,]?\s*([$]*\w+)?\s*>/gi;
        do {
            var match = re.exec(state.note);
            if (match && match[1] > 0) {
              ImageManager.loadSvActor(match[2]);
            }
            else if (match && -match[1] < 0) {
              ImageManager.loadSvEnemy(match[2]);
            }
        } while (match);
    }, this);
  Jene.spriteBattlerInitialize.call(this, battler);
};
