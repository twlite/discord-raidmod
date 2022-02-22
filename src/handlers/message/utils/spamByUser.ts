import type { GuildMember, Message } from "discord.js";
import type { DiscordRaidMod } from "../../../core/SpamBlocker";
import { SpamType } from "../../../utils/enums";
import { isNewUser } from "../../../utils/isNewUser";

export async function antiSpamByUser(rm: DiscordRaidMod, message: Message<true>) {
    const key = rm.config.get("spamByUser").makeKey(message);
    const bucket = rm.userBucket.acquire(key);

    if (bucket.limited) {
        rm.emit("spam", [message], SpamType.CONTENT_SPAM);
        const isFastJoiner = rm.fastJoiners[message.guildId]?.some((x) => x.memberId === message.author.id);
        const _isNewUser = !isTrustable(message.member!, rm);
        if (isFastJoiner && !_isNewUser) rm.emit("userSpam", message, SpamType.FAST_JOINERS_SPAM);
        else if (!isFastJoiner && _isNewUser) rm.emit("userSpam", message, SpamType.NEW_USER_SPAM);
        else rm.emit("userSpam", message, SpamType.USER_SPAM);
        return;
    }

    bucket.consume();
}

function isTrustable(member: GuildMember, rm: DiscordRaidMod) {
    const byCreation = rm.config.get("safeMember").ageByCreation();
    const byJoin = rm.config.get("safeMember").ageByJoin();

    return isNewUser(member.joinedTimestamp!, member.user.createdTimestamp, byCreation, byJoin);
}
