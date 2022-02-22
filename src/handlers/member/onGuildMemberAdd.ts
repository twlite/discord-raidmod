import type { GuildMember } from "discord.js";
import type { DiscordRaidMod } from "../../core/SpamBlocker";
import { isNewUser } from "../../utils/isNewUser";

export async function onGuildMemberAddCallback(rm: DiscordRaidMod, member: GuildMember): Promise<void> {
    if (rm.config.get("ignoreBots") && member.user.bot) return;
    // dk
    if (!member.guild.available) return;
    if (!(await rm.config.get("filterMembers")(member))) return;
    const _isNewUser = !isTrustable(member, rm);

    rm.lastJoinCache.set(member.guild.id, member.joinedTimestamp!);

    if (isFastJoin(rm.lastJoinCache.get(member.guild.id)!, member.joinedTimestamp!, rm.config.get("fastJoinTimeout"))) {
        const fastJoinersData = {
            guildId: member.guild.id,
            createdAt: member.user.createdAt,
            joinedAt: member.joinedAt!,
            memberId: member.id,
            newUser: _isNewUser
        };

        if (!rm.fastJoiners[member.guild.id]) rm.fastJoiners[member.guild.id] = [fastJoinersData];
        else rm.fastJoiners[member.guild.id].push(fastJoinersData);

        rm.emit("fastJoin", {
            member,
            metadata: fastJoinersData
        });
    }
}

function isFastJoin(last: number, now: number, timeout: number) {
    if (typeof last !== "number" || typeof now !== "number" || typeof timeout !== "number") return false;
    return now - last <= timeout;
}

function isTrustable(member: GuildMember, rm: DiscordRaidMod) {
    const byCreation = rm.config.get("safeMember").ageByCreation();
    const byJoin = rm.config.get("safeMember").ageByJoin();

    return isNewUser(member.joinedTimestamp!, member.user.createdTimestamp, byCreation, byJoin);
}
