import { createConfig } from "../utils/createConfig";
import { RateLimitManager } from "@sapphire/ratelimits";
import type { Client, Collection, GuildMember, Message } from "discord.js";
import { onMessageHandlerCallback } from "../handlers/message/onMessage";
import { TypedEmitter } from "../utils/typed_emitter/typedEmitter";
import { SpamType } from "../utils/enums";
import { onGuildMemberAddCallback } from "../handlers/member/onGuildMemberAdd";
import { isNewUser } from "../utils/isNewUser";

export interface FastJoiner {
    member: GuildMember;
    metadata: {
        guildId: string;
        memberId: string;
        newUser: boolean;
        createdAt: Date;
        joinedAt: Date;
    };
}

interface SpamBlockerEvents {
    error: (error: Error) => Awaited<void>;
    spam: (messages: Message<true>[], type: SpamType) => Awaited<void>;
    userSpam: (message: Message<true>, type: SpamType) => Awaited<void>;
    fastJoin: (member: FastJoiner) => Awaited<void>;
    spamMentions: (message: Message<true>, mentions: Collection<string, GuildMember>) => Awaited<void>;
}

class SpamBlocker extends TypedEmitter<SpamBlockerEvents> {
    public contentBucket!: RateLimitManager;
    public crossContentBucket!: RateLimitManager;
    public userBucket!: RateLimitManager;
    public newUserBucket!: RateLimitManager;
    public lastJoinCache = new Map<string, number>();
    public contentSpamCache: Record<
        string,
        {
            guildId: string;
            channelId: string;
            messages: Array<{ id: string; author: string }>;
        }
    > = {};
    public crossContentSpamCache: Record<
        string,
        {
            guildId: string;
            messages: Array<{ id: string; author: string; channel: string }>;
        }
    > = {};
    public fastJoiners: Record<string, Array<Pick<FastJoiner, "metadata">["metadata"]>> = {};

    private _clearCacheClock: NodeJS.Timer | null = null;

    public constructor(public client: Client<true>, public readonly config = createConfig()) {
        super();
        Object.defineProperty(this, "client", { enumerable: false, configurable: true, writable: true });
        this.initialize();

        if (this.config.get("autoRegister")) {
            this.client.on("messageCreate", this.handleMessage.bind(this));
            this.client.on("guildMemberAdd", this.handleGuildMemberAdd.bind(this));
        }
    }

    public handleMessage(message: Message) {
        onMessageHandlerCallback(this, message as Message<true>);
    }

    public handleGuildMemberAdd(member: GuildMember) {
        onGuildMemberAddCallback(this, member);
    }

    public clearAll() {
        this.contentSpamCache = {};
        this.crossContentSpamCache = {};
        this.fastJoiners = {};
        this.contentBucket.clear();
        this.crossContentBucket.clear();
        this.lastJoinCache.clear();
        this.newUserBucket.clear();
        this.userBucket.clear();
    }

    public initialize() {
        this.initializeContentBucket();
        this.initializeCrossContentBucket();
        this.initializeNewUserBucket();
        this.initializeUserBucket();
        this._initializeClock();
    }

    private _initializeClock() {
        if (this._clearCacheClock) clearInterval(this._clearCacheClock);
        this.fastJoiners = {};
        this._clearCacheClock = setInterval(() => {
            this.fastJoiners = {};
            this.crossContentSpamCache = {};
            this.contentSpamCache = {};
        }, 30_000 * 60).unref();
    }

    public isNewMember(member: GuildMember) {
        const byCreation = this.config.get("safeMember").ageByCreation();
        const byJoin = this.config.get("safeMember").ageByJoin();
        return isNewUser(member.joinedTimestamp!, member.user.createdTimestamp, byCreation, byJoin);
    }

    public isFastJoiner(guild: string, user: string) {
        return !!this.fastJoiners[guild]?.some((x) => x.memberId === user);
    }

    // #region bucket initializers
    private initializeContentBucket() {
        if (this.contentBucket) return;
        const config = this.config.get("spamByContent");
        this.contentBucket = new RateLimitManager(config.timeout, config.max);
    }

    private initializeCrossContentBucket() {
        if (this.crossContentBucket) return;
        const config = this.config.get("spamByCrossContent");
        this.crossContentBucket = new RateLimitManager(config.timeout, config.max);
    }

    private initializeUserBucket() {
        if (this.userBucket) return;
        const config = this.config.get("spamByUser");
        this.userBucket = new RateLimitManager(config.timeout, config.max);
    }

    private initializeNewUserBucket() {
        if (this.userBucket) return;
        const config = this.config.get("spamByNewUsers");
        this.newUserBucket = new RateLimitManager(config.timeout, config.max);
    }
    // #endregion bucket initializers
}

export { SpamBlocker as DiscordRaidMod };
