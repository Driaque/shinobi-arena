# Fabled Rivals community setup

This sets up the existing FabledRivals server via Discord REST v10. It does not use the game’s OAuth secret, user tokens, browser cookies, or a continuously running bot process. The public invite is https://discord.gg/XNsBFyPRAP. Invite expiry is managed by the server owner.

## Owner setup

1. Open https://discord.com/developers/applications in your own browser. Create an application named **Fabled Rivals Community**. Keep it separate from the game’s Discord sign-in application.
2. In **Bot**, generate a bot token. Store it directly in GitHub repository **Settings → Secrets and variables → Actions → New repository secret**, named `DISCORD_COMMUNITY_BOT_TOKEN`. Do not put the token in chat, source code, screenshots, workflow inputs, or logs. The token is not the application client secret. No privileged Gateway intents are needed.
3. In **Installation**, enable Guild Install. In the OAuth2 URL Generator choose scope **bot** and these permissions: View Channels, Send Messages, Read Message History, Manage Channels, Manage Roles, Create Public Threads, Create Private Threads, and Send Messages in Threads. Thread permissions let the script restrict member posting in news channels. Do not grant Administrator, Manage Server, Kick Members, Ban Members, or Manage Webhooks.
4. Open the generated installation URL, select **FabledRivals**, and authorize it. This authorization is the owner’s action. Put the bot’s role above the community roles it will manage. Do not share the bot token with anyone to install it.
5. Enable Discord Developer Mode, then use **Copy Server ID** on FabledRivals. This public identifier is `DISCORD_GUILD_ID`, not an invite code.

## Preview and apply

No dependencies are needed beyond Node 22 or newer.

```sh
node scripts/setup-discord-community.mjs
```

This prints the complete plan without requesting a token or contacting Discord. Review its channel descriptions and starter posts before applying.

After the workflow is merged into the default branch, open GitHub **Actions → Set up Discord community → Run workflow**. Enter the server ID. Leave **apply** off for an offline preview, then run with **apply** enabled to perform setup. The manual workflow reads the bot token from the repository secret. A failed job can be rerun after fixing the reported problem; no bot token is printed.

For local execution instead, populate `DISCORD_BOT_TOKEN` and `DISCORD_GUILD_ID` through your secure environment and run:

```sh
node scripts/setup-discord-community.mjs --apply
```

## Created structure

| Category | Channels |
| --- | --- |
| START HERE | welcome, rules, introductions |
| GAME NEWS | announcements, updates, roadmap, sneak-peeks |
| COMMUNITY | general-chat, find-a-match, clips-and-highlights, strategy-and-loadouts |
| HELP SHAPE THE GAME | feedback-and-ideas, bug-reports, balance-discussion |
| EVENTS | playtests, tournaments |
| VOICE | Community Lounge, Duel Room, Co-op Room |
| STAFF, private | moderation, development |

These are ordinary text and voice channels, with a request to use discussion threads for individual bugs and suggestions. Community mode, announcement-channel publishing, forum channels, AutoMod, rules acceptance, and self-service roles are not configured by this script. The Co-op Room is a conversation space and does not imply co-op gameplay has shipped.

Roles: **Community Moderator**, **Playtester**, **Event Notifications**, and **Update Notifications**. They start with zero server-wide permission bits. Community Moderator gets channel access to staff areas and posting in news channels; it does not gain ban, kick, timeout, or message-deletion powers. Assign it only to trusted staff. Assign optional notification roles manually; no role assignment or pings happen automatically.

## Reruns, limits, and verification

- No existing channels, messages, or roles are deleted. No existing channel permissions are rewritten. An existing name with a different type, parent, or permission overwrite causes a stop for manual review. Partial progress is kept.
- Matching resources are reused. Each starter post’s ID is saved in the channel topic. If a run is interrupted between posting and saving that ID, the latest 100 messages are checked for its marker. Run again promptly; if the marker has moved beyond that window, review the channel before rerunning to avoid a duplicate starter post.
- A deleted or edited saved starter post can stop a rerun. Resolve that channel manually rather than assuming it was restored. Never remove the `setup-message` topic marker casually.
- Existing elevated or managed roles with matching names cause a stop; the script does not adopt those roles or reduce their permissions.
- The server must be named FabledRivals or Fabled Rivals. The bot must already be installed in that server. API rate limits are respected with bounded retries; ambiguous network failures stop instead of blindly repeating writes.
- Normal text/voice channels inherit ordinary member capabilities from existing server roles. Read-only channels deny member message and thread posting, while allowing reactions. Staff channels deny View Channel to everyone except the configured moderator role and bot; the owner and administrators retain access. Existing role-specific denies can still limit the bot or staff.
- After setup, use Discord’s **View Server As Role** to verify normal members cannot see STAFF or post in news channels. Verify introductions, match requests, reactions and voice rooms work. Assign Community Moderator to yourself or trusted staff as appropriate, and confirm staff can post news. Your server-owner access does not depend on this role.
- This is a one-time REST setup. It does not schedule events, announce releases automatically, enable gameplay features, or install a persistent command handler. Later release-posting automation requires a separate explicitly configured workflow.

Validation: automated tests mock the REST API to prove rerun behavior, privacy overwrites, permission preflight, duplicate-name rejection, rate limiting and suppressed mentions. Live Discord setup is only verified after an authorized run succeeds and the owner checks member permissions.

Official API references: https://docs.discord.com/developers/resources/guild, https://docs.discord.com/developers/resources/message, https://docs.discord.com/developers/topics/permissions, https://docs.discord.com/developers/topics/rate-limits.
