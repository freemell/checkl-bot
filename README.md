# Telegram Tag Bot

A Telegram bot that can tag everyone in a group when certain trigger words are used.

## Features

- Automatically tags group administrators in a Telegram group when trigger words are detected
- Works in both groups and supergroups
- Supports multiple trigger phrases
- Includes help command (/help) for user guidance
- Graceful error handling and logging
- Enhanced version with better user experience

## Trigger Words

The bot responds to the following trigger words/phrases:
- `tag all`
- `@all`
- `is everyone here?`
- `tag everybody`
- `everyone`
- `tag everyone`
- `call everyone`
- `summon all`

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure the bot:**
   - The bot token is already configured in `config.js`
   - If you need to change it, edit the `BOT_TOKEN` in `config.js`

3. **Start the bot:**
   ```bash
   npm start
   ```

   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

   Or use the enhanced version:
   ```bash
   npm run enhanced
   ```

## Usage

1. Add the bot to your Telegram group
2. Make sure the bot has permission to read messages and send messages
3. Type any of the trigger words in the group
4. The bot will automatically tag group administrators
5. Use `/help` command to see available commands and limitations

**Note:** Due to Telegram's privacy settings, the bot can only tag group administrators. To tag everyone in the group, you can:
- Ask group admins to enable the @all feature
- Use Telegram's built-in mention feature
- Use the @all command if it's enabled in your group

## Bot Permissions

The bot needs the following permissions in the group:
- Read messages
- Send messages
- View group members (for tagging functionality)

## Technical Details

- Built with Node.js and `node-telegram-bot-api`
- Uses polling to receive updates from Telegram
- Supports Markdown formatting in messages
- Includes error handling and graceful shutdown

## Troubleshooting

- Make sure the bot token is valid
- Ensure the bot has proper permissions in the group
- Check console logs for any error messages
- The bot only works in groups and supergroups, not in private chats

## License

MIT 