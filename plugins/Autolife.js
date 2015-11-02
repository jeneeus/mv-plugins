//==============================================================================
// ** Special State: Autolife
// by: Jeneeus Guruman
//------------------------------------------------------------------------------

var Imported = Imported || {};
var Jene = Jene || {};

/*:
 * @plugindesc Special State: Autolife v1.0.1
 * @author Jeneeus Guruman
 *
 * @param Autolife Animation ID
 * @desc The ID of the animation to be played when KO-ed
 * @default 49
 *
 * @help
 *
 *     This plugin allows to include a state that will automatically 
 *   revive the KO-ed target whenever the state is active. Once the
 *   target is automatically revive, the state will be removed.
 *
 *       <autolife: percent>
 *
 *       percent: The percentage of amount to be modified with amount 
 *     of MaxHP to be recovered. Multiple tags will take the value 
 *     of the tagged state that has the highest state priority.
 *
 *       Notes: 
 *       * None.
 *
 *   Changelog:
 *
 *     * v1.0.1: Made compatible with Yanfly Engine Core.
 */

parameters = PluginManager.parameters('Autolife');

Jene.autolifeAnimationId = Number(parameters['Autolife Animation ID']);

Jene.battleManagerCheckBattleEnd = BattleManager.checkBattleEnd;

BattleManager.checkBattleEnd = function() {
	$gameParty.deadMembers().forEach(function(actor) {
		if (actor.autolifeStateId() > 0) {
			console.log(actor.mhp * actor.autolife);
			actor.removeState(actor.deathStateId());
			actor.gainHp(Math.round(actor.mhp * actor.autolife - 1));
			actor.removeState(actor.autolifeStateId());
			actor.startAnimation(Jene.autolifeAnimationId, true, $dataAnimations[Jene.autolifeAnimationId].frames * 4);
			if (Imported.YEP_BattleEngineCore) {
				BattleManager.actionWaitForAnimation();
			}
		}
	});
	$gameTroop.deadMembers().forEach(function(enemy) {
		if (enemy.autolifeStateId() > 0) {
			enemy.removeState(enemy.deathStateId());
			enemy.gainHp(Math.round(enemy.mhp * enemy.autolife - 1));
			enemy.removeState(enemy.autolifeStateId());
			enemy.startAnimation(Jene.autolifeAnimationId, false, $dataAnimations[Jene.autolifeAnimationId].frames * 4);
			if (Imported.YEP_BattleEngineCore) {
				BattleManager.actionWaitForAnimation();
			}
		}
	});
	return Jene.battleManagerCheckBattleEnd.call(this);
};

Object.defineProperty(Game_BattlerBase.prototype, 'autolife', { 
	get: function() {
		if (this.autolifeStateId() > 0) {
			return $dataStates[this.autolifeStateId()].meta.autolife / 100;
		}
		else {
			return 0;
		}
	},
	configurable: true
});

Game_BattlerBase.prototype.autolifeStateId = function() {
    var stateId = 0;
    this.states().forEach(function(state) {
		if (state.meta.autolife) {
			stateId = state.id;
			return;
		}
	});
	return stateId;
};

Jene.gameBattlerBaseClearStates2 = Game_BattlerBase.prototype.clearStates;

Game_BattlerBase.prototype.clearStates = function() {
	if (this._states) {
		autolifeStates = []
		this.states().forEach(function(state) {
			if (state.meta.autolife) {
				autolifeStates.push(state.id);
			}
		});
		Jene.gameBattlerBaseClearStates2.call(this);
	    this._states = autolifeStates;
	}
	else {
		Jene.gameBattlerBaseClearStates2.call(this);
	}
};