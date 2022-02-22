import type { GuildMember, Message, TextBasedChannel } from "discord.js";
import type { DiscordRaidMod } from "../../../core/SpamBlocker";
import { SpamType } from "../../../utils/enums";
import { isNewUser } from "../../../utils/isNewUser";

export async function antiSpamByCrossContent(rm: DiscordRaidMod, message: Message<true>) {
    const key = rm.config.get("spamByCrossContent").makeKey(message);

    if (!rm.crossContentSpamCache[key]) {
        rm.crossContentSpamCache[key] = {
            guildId: message.guildId,
            messages: [
                {
                    channel: message.channelId,
                    id: message.id,
                    author: message.author.id
                }
            ]
        };
    } else {
        rm.crossContentSpamCache[key].messages.push({
            author: message.member!.id,
            id: message.id,
            channel: message.channelId
        });
    }

    const bucket = rm.crossContentBucket.acquire(key);

    if (bucket.limited) {
        const spams = rm.crossContentSpamCache[key];
        // why?
        if (!spams?.messages?.length) return;
        const spamMessages = spams.messages.map((m) => (rm.client.channels.cache.get(m.channel) as TextBasedChannel)?.messages?.cache.get(m.id) as Message<true>).filter((m) => m != null);

        rm.emit("spam", spamMessages, SpamType.CROSS_CONTENT_SPAM);
        rm.crossContentSpamCache[key].messages = rm.crossContentSpamCache[key].messages.filter((x) => !spamMessages.some((y) => y.id === x.id));
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
