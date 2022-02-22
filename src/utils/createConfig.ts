import type { GuildMember, Message } from "discord.js";
import { hashContent } from "./createHash";

export const defaultConfig = {
    ignoreBots: true,
    filterMessages: (message: Message<true>): Awaited<boolean> => true,
    filterMembers: (member: GuildMember): Awaited<boolean> => true,
    fastJoinTimeout: 2_000,
    maxMentions: 10,
    spamByContent: {
        timeout: 15_000,
        max: 10,
        makeKey: (message: Message<true>): string => {
            return `${message.guildId}::${message.channelId}::${hashContent(message.content)}`;
        }
    },
    spamByCrossContent: {
        timeout: 17_000,
        max: 15,
        makeKey: (message: Message<true>): string => {
            return `${message.guildId}::${message.author.id}::${hashContent(message.content)}`;
        }
    },
    spamByUser: {
        timeout: 12_000,
        max: 10,
        makeKey: (message: Message<true>): string => {
            return `${message.guildId}::${message.channelId}::${message.author.id}`;
        }
    },
    spamByNewUsers: {
        timeout: 35_000,
        max: 30,
        makeKey: (message: Message<true>): string => {
            return `${message.guildId}::${message.channelId}::${message.author.id}`;
        }
    },
    spamByFastJoiners: {
        timeout: 12_000,
        max: 10,
        makeKey: (message: Message<true>): string => {
            return `${message.guildId}::${message.channelId}::${message.author.id}`;
        }
    },
    safeMember: {
        ageByCreation: () => Date.now() - 2.419e9,
        ageByJoin: () => Date.now() - 6.048e8
    },
    autoRegister: true
};

export type RMConfig = typeof defaultConfig;
export type RMConfigPartial = Partial<RMConfig>;

export const createConfig = (config: RMConfigPartial = defaultConfig) => {
    return new ConfigWrapper(Object.assign({}, defaultConfig, config));
};

export class ConfigWrapper {
    constructor(private _internalConfig: RMConfig) {}

    public get<T extends keyof RMConfig>(key: T): RMConfig[T] {
        return this._internalConfig[key] ?? null;
    }

    public set<T extends keyof RMConfig>(key: T, value: Partial<RMConfig[T]>) {
        const oldVal = this._internalConfig[key];
        this._internalConfig[key] = Object.assign({}, oldVal, value);
    }

    public toString() {
        return JSON.stringify(this.toJSON());
    }

    public toJSON(): RMConfig {
        return this._internalConfig;
    }
}
