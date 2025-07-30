const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

// Create a bot instance
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Trigger words that will cause the bot to tag everyone
const triggerWords = [
  'tag all',
  '@all',
  'is everyone here?',
  'tag everybody',
  'tag everyone',
  'call everyone',
  'summon all'
];

// Function to get chat administrators and create mentions
async function getChatMembersForTagging(chatId) {
  try {
    // Get chat administrators
    const admins = await bot.getChatAdministrators(chatId);
    
    // Create mention list
    const mentions = [];
    
    for (const admin of admins) {
      const user = admin.user;
      if (user.username) {
        mentions.push(`@${user.username}`);
      } else {
        // For users without username, we can't create a proper mention
        // but we can include their name
        const fullName = user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
        mentions.push(fullName);
      }
    }
    
    return {
      mentions,
      count: admins.length,
      type: 'admins'
    };
  } catch (error) {
    console.error('Error getting chat members:', error);
    return {
      mentions: [],
      count: 0,
      type: 'error'
    };
  }
}

// Function to create a tag message
function createTagMessage(mentions) {
  if (!mentions || mentions.length === 0) {
    return "Sorry, I couldn't get the member list for this group.";
  }
  
  return `${mentions.join(' ')} Hiiii listen`;
}

// Function to send help message
function sendHelpMessage(chatId) {
  const helpMessage = `🤖 Advanced Tag Bot Help

Available Commands:
• tag all - Tag everyone
• @all - Tag everyone  
• is everyone here? - Tag everyone
• tag everybody - Tag everyone
• everyone - Tag everyone
• tag everyone - Tag everyone
• call everyone - Tag everyone
• summon all - Tag everyone

Note: Due to Telegram's privacy settings, I can only tag group administrators. To tag everyone in the group, you can:
1. Ask group admins to enable the @all feature
2. Use Telegram's built-in mention feature
3. Use the @all command if it's enabled in your group

Bot Permissions Required:
• Read messages
• Send messages
• View group members`;

  bot.sendMessage(chatId, helpMessage, {
    disable_web_page_preview: true
  });
}

// Handle incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text?.toLowerCase() || '';
  const chatType = msg.chat.type;
  
  // Only respond in groups and supergroups
  if (chatType !== 'group' && chatType !== 'supergroup') {
    return;
  }
  
  // Check for help command
  if (messageText === '/help' || messageText === '/start') {
    sendHelpMessage(chatId);
    return;
  }
  
  // Check if the message contains any trigger words
  const hasTriggerWord = triggerWords.some(trigger => 
    messageText.includes(trigger.toLowerCase())
  );
  
  if (hasTriggerWord) {
    try {
      console.log(`Trigger word detected: "${messageText}" in chat ${chatId}`);
      
      // Send a typing indicator
      bot.sendChatAction(chatId, 'typing');
      
      // Get chat members for tagging
      const result = await getChatMembersForTagging(chatId);
      
      if (result.mentions.length > 0) {
        const tagMessage = createTagMessage(result.mentions);
        
        // Send the tagged message without Markdown to avoid parsing errors
        await bot.sendMessage(chatId, tagMessage, {
          disable_web_page_preview: true
        });
      } else {
        await bot.sendMessage(chatId, "Sorry, I couldn't retrieve the member list for this group. Make sure I have the necessary permissions.");
      }
      
    } catch (error) {
      console.error('Error processing tag request:', error);
      await bot.sendMessage(chatId, "Sorry, there was an error while trying to tag everyone. Please check my permissions.");
    }
  }
});

// Handle bot errors
bot.on('error', (error) => {
  console.error('Bot error:', error);
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

// Bot startup message
console.log('🤖 Advanced Telegram Tag Bot is starting...');
console.log('📝 Trigger words:');
triggerWords.forEach(word => console.log(`   - "${word}"`));
console.log('✅ Bot is now running and listening for messages...');
console.log('💡 Type /help in a group to see available commands');

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  process.exit(0);
}); 