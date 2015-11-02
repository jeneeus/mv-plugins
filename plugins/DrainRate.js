//==============================================================================
// ** Special Parameter: Drain Rate
// by: Jeneeus Guruman
//------------------------------------------------------------------------------

var Jene = Jene || {};

/*:
 * @plugindesc Special Parameter: Drain Rate v1.0.0
 * @author Jeneeus Guruman
 *
 * @help
 *
 *     This plugin allows to include a paramter that will PASSIVELY drains 
 *   a percentage of damage based on the damage dealt to the target as long 
 *   as the one that has a drain rate parameter.
 *
 *       <dhr: percent>
 *
 *       percent: The percentage of amount of HP to be drained based on 
 *     the damage. The default is 0. Multiple tags will add all values 
 *     by percentage (e.g. 200% + -50% = 150%).
 *
 *       <dmr: percent>
 *
 *       percent: The percentage of amount of MP to be drained based on 
 *     the damage. The default is 0. Multiple tags will add all values 
 *     by percentage (e.g. 200% + -50% = 150%).
 *
 *       <dhr_exclude>
 *       <dmr_exclude>
 *
 *       Skills and items assigned to this will not drain any damage. 
 *
 *       Notes: 
 *       * This will only affect the damage formula and not the effects.
 *       * This can be placed with negative values and thus can be used as
 *       a recoil state instead.
 *       * Will only work on "HP Damage" damage type skills and items.
 */

Object.defineProperty(Game_BattlerBase.prototype, 'dhr', { 
	get: function() {	
		var value = 0;
		this.traitObjects().forEach(function(trait) {
			var dhr = parseFloat(trait.meta.dhr) || 0;
			value += dhr;
		});
		return value / 100;
	},
	configurable: true
});

Object.defineProperty(Game_BattlerBase.prototype, 'dmr', { 
	get: function() {
		var value = 0;
		this.traitObjects().forEach(function(trait) {
			var dmr = parseFloat(trait.meta.dmr) || 0;
			value += dmr;
		});
		return value / 100;
	},
	configurable: true
});

Jene.gameActionExecuteDamage = Game_Action.prototype.executeDamage;

Game_Action.prototype.executeDamage = function(target, value) {
	Jene.gameActionExecuteDamage.call(this, target, value);
    if (this.isHpEffect() && value > 0) {
    	if (this.subject().dhr != 0 && !this.item().meta.dhr_exclude) {
        	this.subject().gainHp(Math.round(value * this.subject().dhr));
        }
    	if (this.subject().dmr != 0 && !this.item().meta.dmr_exclude) {
        	this.subject().gainMp(Math.round(value * this.subject().dmr));
        }
    }
};
