# Discord Raid Moderator

Simple, beginner friendly and easy-to-use discord.js moderation framework

> **NOTE:** This library does not take any moderation actions on its own, rather it emits different type of events which needs to be handled by the user.

# Features

* Simple
* Easy to use
* Made for beginners
* Does not inject anything to the client
* Customizable

# Spam Detection

* User spam detection
  * Triggers when user spams in a channel
* Cross message spam detection
  * Triggers when user spams same content in multiple channels
* Message content spam detection
  * Triggers when the same message content is posted in a channel multiple times
* Fast join detection
  * Triggers when fast member join is detected
* Fast joiners spam detection
  * Triggers when fast joiners start spamming
* New members spam detection
  * Triggers when new members (new account) start spamming
* Mentions spam detection
  * Triggers when message exceeds specified mentions threshold

# Status

* Development (Expect breaking changes)

# Example

```js
import { Client, Intents } from "discord.js";
import { DiscordRaidMod, createConfig } from "discord-raidmod";

const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_BANS
    ]
});
const raidMod = new DiscordRaidMod(client, createConfig({
    // ignore messages from mods (bots are ignored by default)
    filterMessages: (message) => !message.member.permissions.has("MANAGE_MESSAGES"),
    // other than that, default config is good enough to handle spams
    // but you can update them as needed ;)
}));

// when spam event is triggered,
// we get array of messages that were flagged as spam messages
// and spam type
raidMod.on("spam", async (messages, spamType) => {
    const spammers = [...new Set(messages.map(m => m.author.id))];

    for (const spammer of spammers) {
        if (!messages[0].guild.members.cache.get(spammer)?.bannable) continue;
        await messages[0].guild.bans.create(spammer, {
            days: 1,
            reason: "Spam detection"
        })
        .then((banInfo) => {
            console.log(`[${spamType}] Banned ${banInfo.user?.tag ?? banInfo.tag ?? banInfo} for spam`);
        })
        .catch(() => {});
    }
});

// when spamMentions event is triggered,
// we get the message that triggered this event,
// and collection of member mentions
raidMod.on("spamMentions", async (message, mentions) => {
    const spammers = [...new Set(messages.map(m => m.author.id))];

    for (const spammer of spammers) {
        if (!message.member.bannable) continue;
        await message.guild.bans.create(spammer, {
            days: 1,
            reason: "Mention spam"
        })
        .then((banInfo) => {
            console.log(`Banned ${banInfo.user?.tag ?? banInfo.tag ?? banInfo} for spamming ${mentions.size} mentions`);
        })
        .catch(() => {});
    }
});

await client.login("TOKEN");
```