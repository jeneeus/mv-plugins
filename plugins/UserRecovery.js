//==============================================================================
// ** Special Parameter: User Recovery Rate
// by: Jeneeus Guruman
//------------------------------------------------------------------------------

var Jene = Jene || {};

/*:
 * @plugindesc Special Parameter: User Recovery Rate v1.0.0
 * @author Jeneeus Guruman
 *
 * @help
 *
 *     This plugin allows to include a paramter that will give you the recovery
 *   power of the user's skills rather than the default's recovery rate that 
 *   increases the recovery rate received. It is similar to "Pharmacology" but
 *   but with skills instead of items.
 *
 *       <urec: percent>
 *
 *       percent: The percentage of amount to be modified with the 
 *     user's recovery rate. The default is 100. Multiple tags will 
 *     multiply all values by percentage (e.g. 200% * 50% = 100%).
 *
 *       Notes: 
 *       * This will only affect the damage formula and not the effects.
 */

Object.defineProperty(Game_BattlerBase.prototype, 'urec', { 
	get: function() {
		var value = 1;
		this.traitObjects().forEach(function(trait) {
			var urec = parseFloat(trait.meta.urec) || 100;
			value *= urec / 100;
		});
		return value;
	},
	configurable: true
});

Jene.gameActionMakeDamageValue = Game_Action.prototype.makeDamageValue;

Game_Action.prototype.makeDamageValue = function(target, critical) {
    var value = Jene.gameActionMakeDamageValue.call(this, target, critical);
    if (value < 0) {
        value *= this.subject().urec;
    }
    value = Math.round(value);
    return value;
};