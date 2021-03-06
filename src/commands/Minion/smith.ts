import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/BotCommand';
import {
	stringMatches,
	formatDuration,
	rand,
	itemNameFromID,
	removeItemFromBank
} from '../../lib/util';
import { SkillsEnum } from '../../lib/types';
import { Time, Activity, Tasks, Events } from '../../lib/constants';
import { SmithingActivityTaskOptions } from '../../lib/types/minions';
import addSubTaskToActivityTask from '../../lib/util/addSubTaskToActivityTask';
import Smithing from '../../lib/skills/smithing';
import bankHasItem from '../../lib/util/bankHasItem';
import { UserSettings } from '../../lib/UserSettings';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			altProtection: true,
			oneAtTime: true,
			cooldown: 1,
			usage: '<quantity:int{1}|name:...string> [name:...string]',
			usageDelim: ' '
		});
	}

	async run(msg: KlasaMessage, [quantity, barName = '']: [null | number | string, string]) {
		if (!msg.author.hasMinion) {
			throw `You dont have a minion`;
		}

		if (msg.author.minionIsBusy) {
			return msg.send(msg.author.minionStatus);
		}

		if (typeof quantity === 'string') {
			barName = quantity;
			quantity = null;
		}

		const bar = Smithing.Bars.find(
			bar =>
				stringMatches(bar.name, barName) || stringMatches(bar.name.split(' ')[0], barName)
		);

		if (!bar) {
			throw `Thats not a valid bar to smith. Valid bars are ${Smithing.Bars.map(
				bar => bar.name
			).join(', ')}.`;
		}

		if (msg.author.skillLevel(SkillsEnum.Smithing) < bar.level) {
			throw `${msg.author.minionName} needs ${bar.level} Smithing to smith ${bar.name}s.`;
		}

		// All bars take 2.4s to smith, add on quarter of a second to account for banking/etc.
		const timeToSmithSingleBar = Time.Second * 2.4 + Time.Second / 4;

		// If no quantity provided, set it to the max.
		if (quantity === null) {
			quantity = Math.floor(msg.author.maxTripLength / timeToSmithSingleBar);
		}

		await msg.author.settings.sync(true);
		const userBank = msg.author.settings.get(UserSettings.Bank);

		// Check the user has the required ores to smith these bars.
		// Multiplying the ore required by the quantity of bars.
		const requiredOres: [string, number][] = Object.entries(bar.inputOres);
		for (const [oreID, qty] of requiredOres) {
			if (!bankHasItem(userBank, parseInt(oreID), qty * quantity)) {
				throw `You don't have enough ${itemNameFromID(parseInt(oreID))}.`;
			}
		}

		const duration = quantity * timeToSmithSingleBar;

		if (duration > msg.author.maxTripLength) {
			throw `${msg.author.minionName} can't go on trips longer than ${formatDuration(
				msg.author.maxTripLength
			)}, try a lower quantity. The highest amount of ${
				bar.name
			}s you can smith is ${Math.floor(msg.author.maxTripLength / timeToSmithSingleBar)}.`;
		}

		const data: SmithingActivityTaskOptions = {
			barID: bar.id,
			userID: msg.author.id,
			channelID: msg.channel.id,
			quantity,
			duration,
			type: Activity.Smithing,
			id: rand(1, 10_000_000),
			finishDate: Date.now() + duration
		};

		// Remove the ores from their bank.
		let newBank = { ...userBank };
		for (const [oreID, qty] of requiredOres) {
			if (newBank[parseInt(oreID)] < qty) {
				this.client.emit(
					Events.Wtf,
					`${msg.author.sanitizedName} had insufficient ores to be removed.`
				);
				throw `What a terrible failure :(`;
			}
			newBank = removeItemFromBank(newBank, parseInt(oreID), qty * quantity);
		}

		await addSubTaskToActivityTask(this.client, Tasks.SkillingTicker, data);
		await msg.author.settings.update(UserSettings.Bank, newBank);

		msg.author.incrementMinionDailyDuration(duration);
		return msg.send(
			`${msg.author.minionName} is now smithing ${quantity}x ${
				bar.name
			}, it'll take around ${formatDuration(duration)} to finish.`
		);
	}
}
