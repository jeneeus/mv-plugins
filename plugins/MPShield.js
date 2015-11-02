//==============================================================================
// ** Special State: MP Shield
// by: Jeneeus Guruman
//------------------------------------------------------------------------------

var Jene = Jene || {};

/*:
 * @plugindesc Special State: MP Shield v1.0.0
 * @author Jeneeus Guruman
 *
 * @param Remove State On MP Lack
 * @desc Removes the state once the target has 0 MP.
 * @default true
 *
 * @help
 *
 *     This plugin allows to include a state that will convert the HP 
 *   damage received to become MP damage instead. Additionally, it can 
 *   reduced or increase the damage received while having this.
 *
 *       <mps: percent>
 *
 *       percent: The percentage of amount to be modified with the damage 
 *     received. Multiple tags will take the value of the tagged state that 
 *     has the highest state priority.
 *
 *       Notes: 
 *       * This will only affect the damage formula and not the effects.
 *       * If the value of MP shield is 0, it will automatically be 
 *       deactivated.
 */

parameters = PluginManager.parameters('MPShield');

Jene.removeStateOnLack = Boolean(parameters['Remove State On MP Lack']);

Object.defineProperty(Game_BattlerBase.prototype, 'mps', { 
	get: function() {
		if (this.mpShieldStateId() > 0) {
			return $dataStates[this.mpShieldStateId()].meta.mps / 100;
		}
		else {
			return 0;
		}
	},
	configurable: true
});

Game_BattlerBase.prototype.mpShieldStateId = function() {
    var stateId = 0;
    this.states().forEach(function(state) {
		if (state.meta.mps) {
			stateId = state.id;
			return;
		}
	});
	return stateId;
};

Jene.gameActionExecuteDamage2 = Game_Action.prototype.executeDamage;

Game_Action.prototype.executeDamage = function(target, value) {
    if (target.mps > 0 && value > 0 && target.mp > 0) {
        this.executeMpDamage(target, Math.round(value * target.mps));
        if (target.mp == 0 && Jene.removeStateOnLack) {
        	target.removeState(target.mpShieldStateId());
        }
    }
    else {
        Jene.gameActionExecuteDamage2.call(this, target, value);
    }
};