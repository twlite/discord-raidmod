import type { Message } from "discord.js";
import type { DiscordRaidMod } from "../../core/SpamBlocker";
import { antiSpamByContent } from "./utils/spamByContent";
import { antiSpamByCrossContent } from "./utils/spamByCrossContent";
import { antiSpamByFastJoiners } from "./utils/spamByFastJoiners";
import { antiSpamByNewUser } from "./utils/spamByNewUser";
import { antiSpamByUser } from "./utils/spamByUser";

export async function onMessageHandlerCallback(rm: DiscordRaidMod, message: Message<true>): Promise<void> {
    if (message.partial || !message.content) return;
    if (rm.config.get("ignoreBots") && message.author.bot) return;

    if (!message.guildId || !message.inGuild()) return;
    if (!(await rm.config.get("filterMessages")(message))) return;

    const mentionsMax = rm.config.get("maxMentions") || 0;
    if (mentionsMax > 0 && message.mentions.members!.size) {
        const mentions = message.mentions.members!.filter((mem) => !mem.user.bot && mem.id !== message.member!.id);
        if (mentions.size >= mentionsMax) {
            rm.emit("spamMentions", message, mentions);
            return;
        }
    }

    const ctx = [
        antiSpamByContent.bind(null, rm, message),
        antiSpamByCrossContent.bind(null, rm, message),
        antiSpamByFastJoiners.bind(null, rm, message),
        antiSpamByNewUser.bind(null, rm, message),
        antiSpamByUser.bind(null, rm, message)
    ];

    ctx.forEach(async (v) => {
        const res = await execute(v);
        if (res.error) rm.emit("error", res.error);
    });
}

async function execute(fn: () => unknown) {
    try {
        await fn();
        return { error: null };
    } catch (e) {
        return { error: e as Error };
    }
}
