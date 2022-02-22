import type { GuildMember, Message } from "discord.js";
import type { DiscordRaidMod } from "../../../core/SpamBlocker";
import { SpamType } from "../../../utils/enums";
import { isNewUser } from "../../../utils/isNewUser";

export async function antiSpamByContent(rm: DiscordRaidMod, message: Message<true>) {
    const key = rm.config.get("spamByContent").makeKey(message);
    const bucket = rm.contentBucket.acquire(key);

    if (!rm.contentSpamCache[key]) {
        rm.contentSpamCache[key] = {
            guildId: message.guildId,
            channelId: message.channelId,
            messages: [
                {
                    id: message.id,
                    author: message.author.id
                }
            ]
        };
    } else {
        rm.contentSpamCache[key].messages.push({
            author: message.member!.id,
            id: message.id
        });
    }

    if (bucket.limited) {
        const spams = rm.contentSpamCache[key];
        // why?
        if (!spams?.messages?.length) return;
        const spamMessages = spams.messages.map((m) => message.channel.messages.cache.get(m.id) as Message<true>);

        rm.emit("spam", spamMessages, SpamType.CONTENT_SPAM);
        rm.contentSpamCache[key].messages = rm.contentSpamCache[key].messages.filter((x) => !spamMessages.some((y) => y.id === x.id));
        spamMessages.forEach((spamMsg) => {
            const isFastJoiner = rm.fastJoiners[message.guildId]?.some((x) => x.memberId === message.author.id);
            const _isNewUser = !isTrustable(spamMsg.member!, rm);
            if (isFastJoiner && !_isNewUser) rm.emit("userSpam", spamMsg, SpamType.FAST_JOINERS_SPAM);
            else if (!isFastJoiner && _isNewUser) rm.emit("userSpam", spamMsg, SpamType.NEW_USER_SPAM);
            else rm.emit("userSpam", spamMsg, SpamType.USER_SPAM);
        });

        return;
    }

    bucket.consume();
}

function isTrustable(member: GuildMember, rm: DiscordRaidMod) {
    const byCreation = rm.config.get("safeMember").ageByCreation();
    const byJoin = rm.config.get("safeMember").ageByJoin();

    return isNewUser(member.joinedTimestamp!, member.user.createdTimestamp, byCreation, byJoin);
}
