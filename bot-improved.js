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

// Function to get all chat members using the correct API
async function getAllChatMembers(chatId) {
  try {
    // First try to get administrators
    const admins = await bot.getChatAdministrators(chatId);
    
    // For now, we'll use administrators and provide instructions
    // The full member list requires special bot permissions
    return {
      members: admins,
      type: 'admins',
      totalCount: admins.length
    };
  } catch (error) {
    console.error('Error getting chat members:', error);
    return {
      members: [],
      type: 'error',
      totalCount: 0
    };
  }
}

// Function to create a simple tag message without complex Markdown
function createSimpleTagMessage(members, type) {
  if (!members || members.length === 0) {
    return "Sorry, I couldn't get the member list for this group.";
  }

  let tagMessage = "🔔 Everyone has been tagged!\n\n";
  
  members.forEach((member, index) => {
    const username = member.user?.username || member.username;
    const firstName = member.user?.first_name || member.first_name;
    const lastName = member.user?.last_name || member.last_name;
    
    if (username) {
      tagMessage += `@${username} `;
    } else if (firstName) {
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      // Use simple text mention instead of complex Markdown
      tagMessage += `${fullName} `;
    }
    
    // Add line breaks every 5 tags for better readability
    if ((index + 1) % 5 === 0) {
      tagMessage += '\n';
    }
  });
  
  if (type === 'admins') {
    tagMessage += "\n\n💡 Note: I can only tag group administrators due to Telegram's privacy settings.";
    tagMessage += "\nTo tag everyone, ask your group admin to:";
    tagMessage += "\n1. Enable @all feature in group settings";
    tagMessage += "\n2. Or use Telegram's built-in mention feature";
  }
  
  return tagMessage;
}

// Function to send help message
function sendHelpMessage(chatId) {
  const helpMessage = `🤖 Tag Bot Help

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
      
      // Get chat members
      const result = await getAllChatMembers(chatId);
      
      if (result.members.length > 0) {
        const tagMessage = createSimpleTagMessage(result.members, result.type);
        
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
console.log('🤖 Improved Telegram Tag Bot is starting...');
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