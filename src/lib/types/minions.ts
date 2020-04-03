import { Activity, Tasks } from '../constants';
import { TeamMember } from 'oldschooljs/dist/simulation/minigames/ChambersOfXeric';

export interface ActivityTaskOptions {
	type: Activity;
	userID: string;
	duration: number;
	id: number;
	finishDate: number;
}

export interface MonsterActivityTaskOptions extends ActivityTaskOptions {
	monsterID: number;
	channelID: string;
	quantity: number;
}

export interface RaidsActivityTaskOptions extends ActivityTaskOptions {
	channelID: string;
	quantity: number;
	partyLeaderID: string;
	team: TeamMember[];
	challengeMode: boolean;
}

export interface ClueActivityTaskOptions extends ActivityTaskOptions {
	clueID: number;
	channelID: string;
	quantity: number;
}

export interface MiningActivityTaskOptions extends ActivityTaskOptions {
	oreID: number;
	channelID: string;
	quantity: number;
}

export interface SmithingActivityTaskOptions extends ActivityTaskOptions {
	barID: number;
	channelID: string;
	quantity: number;
}
export interface FiremakingActivityTaskOptions extends ActivityTaskOptions {
	burnableID: number;
	channelID: string;
	quantity: number;
}

export interface WoodcuttingActivityTaskOptions extends ActivityTaskOptions {
	logID: number;
	channelID: string;
	quantity: number;
}

export interface QuestingActivityTaskOptions extends ActivityTaskOptions {
	channelID: string;
}

export interface MonsterKillingTickerTaskData {
	subTasks: MonsterActivityTaskOptions[];
}

export interface MinigameTickerTaskData {
	subTasks: RaidsActivityTaskOptions[];
}

export interface ClueTickerTaskData {
	subTasks: ClueActivityTaskOptions[];
}

export interface SkillingTickerTaskData {
	subTasks: ActivityTaskOptions[];
}

export type TickerTaskData =
	| MonsterKillingTickerTaskData
	| ClueTickerTaskData
	| SkillingTickerTaskData
	| MinigameTickerTaskData;

export type MinionActivityTask =
	| Tasks.MonsterActivity
	| Tasks.ClueActivity
	| Tasks.MiningActivity
	| Tasks.SmithingActivity
	| Tasks.WoodcuttingActivity
	| Tasks.FiremakingActivity
	| Tasks.QuestingActivity
	| Tasks.RaidsActivity;
