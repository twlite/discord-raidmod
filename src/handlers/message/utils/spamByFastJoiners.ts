import type { GuildMember, Message } from "discord.js";
import type { DiscordRaidMod } from "../../../core/SpamBlocker";
import { SpamType } from "../../../utils/enums";
import { isNewUser } from "../../../utils/isNewUser";

export async function antiSpamByFastJoiners(rm: DiscordRaidMod, message: Message<true>) {
    if (!isTrustable(message.member!, rm)) return;
    const isFastJoiner = rm.fastJoiners[message.guildId]?.some((x) => x.memberId === message.author.id);
    if (!isFastJoiner) return;

    const key = rm.config.get("spamByNewUsers").makeKey(message);
    const bucket = rm.newUserBucket.acquire(key);

    if (bucket.limited) {
        rm.emit("spam", [message], SpamType.FAST_JOINERS_SPAM);
        rm.emit("userSpam", message, SpamType.FAST_JOINERS_SPAM);
        return;
    }

    bucket.consume();
}

function isTrustable(member: GuildMember, rm: DiscordRaidMod) {
    const byCreation = rm.config.get("safeMember").ageByCreation();
    const byJoin = rm.config.get("safeMember").ageByJoin();

    return isNewUser(member.joinedTimestamp!, member.user.createdTimestamp, byCreation, byJoin);
}
