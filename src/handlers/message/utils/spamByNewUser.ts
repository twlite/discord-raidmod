import type { GuildMember, Message } from "discord.js";
import type { DiscordRaidMod } from "../../../core/SpamBlocker";
import { SpamType } from "../../../utils/enums";
import { isNewUser } from "../../../utils/isNewUser";

export async function antiSpamByNewUser(rm: DiscordRaidMod, message: Message<true>) {
    const isFastJoiner = rm.fastJoiners[message.guildId]?.some((x) => x.memberId === message.author.id);
    if (isFastJoiner) return;

    const _isNewUser = !isTrustable(message.member!, rm);
    if (!_isNewUser) return;

    const key = rm.config.get("spamByNewUsers").makeKey(message);
    const bucket = rm.newUserBucket.acquire(key);

    if (bucket.limited) {
        rm.emit("spam", [message], SpamType.NEW_USER_SPAM);
        rm.emit("userSpam", message, SpamType.NEW_USER_SPAM);
        return;
    }

    bucket.consume();
}

function isTrustable(member: GuildMember, rm: DiscordRaidMod) {
    const byCreation = rm.config.get("safeMember").ageByCreation();
    const byJoin = rm.config.get("safeMember").ageByJoin();

    return isNewUser(member.joinedTimestamp!, member.user.createdTimestamp, byCreation, byJoin);
}
