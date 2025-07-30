const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

// Create a bot instance
const bot = new TelegramBot(config.BOT_TOKEN, { polling: true });

// Phone numbers database
const phoneNumbers = {
  'pink': '09029061353',
  'precious': '08160764370',
  'izzac': '07035658853',
  'david': '09160114833',
  'charlie': '08148736067',
  'sarah': '09110179180'
};

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

// Function to check for phone number requests
function checkPhoneNumberRequest(messageText) {
  const lowerMessage = messageText.toLowerCase();
  
  for (const [name, number] of Object.entries(phoneNumbers)) {
    if (lowerMessage.includes(`call ${name} number`) || 
        lowerMessage.includes(`${name} number`) ||
        lowerMessage.includes(`call ${name}`)) {
      return { name: name.charAt(0).toUpperCase() + name.slice(1), number };
    }
  }
  
  return null;
}

// Function to get chat administrators
async function getChatAdministrators(chatId) {
  try {
    const admins = await bot.getChatAdministrators(chatId);
    return admins;
  } catch (error) {
    console.error('Error getting chat administrators:', error);
    return [];
  }
}

// Function to create a comprehensive tag message
function createTagMessage(members) {
  if (!members || members.length === 0) {
    return "Sorry, I couldn't get the member list for this group.";
  }

  const mentions = [];
  
  members.forEach((member) => {
    const username = member.user?.username || member.username;
    if (username) {
      mentions.push(`@${username}`);
    }
  });
  
  return `${mentions.join(' ')} Hiiii listen`;
}

// Function to send a helpful message about tagging
function sendHelpMessage(chatId) {
  const helpMessage = `🤖 **Tag Bot Help**

**Available Commands:**
• \`tag all\` - Tag group administrators
• \`@all\` - Tag group administrators  
• \`is everyone here?\` - Tag group administrators
• \`tag everybody\` - Tag group administrators
• \`everyone\` - Tag group administrators
• \`tag everyone\` - Tag group administrators
• \`call everyone\` - Tag group administrators
• \`summon all\` - Tag group administrators

**Note:** Due to Telegram's privacy settings, I can only tag group administrators. To tag everyone in the group, you can:
1. Ask group admins to enable the @all feature
2. Use Telegram's built-in mention feature
3. Use the @all command if it's enabled in your group

**Bot Permissions Required:**
• Read messages
• Send messages
• View group members`;

  bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true
  });
}

// Handle incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text || '';
  const chatType = msg.chat.type;
  
  // Only respond in groups and supergroups
  if (chatType !== 'group' && chatType !== 'supergroup') {
    return;
  }
  
  // Check for help command
  if (messageText.toLowerCase() === '/help' || messageText.toLowerCase() === '/start') {
    sendHelpMessage(chatId);
    return;
  }
  
  // Check for phone number requests first
  const phoneRequest = checkPhoneNumberRequest(messageText);
  if (phoneRequest) {
    try {
      console.log(`Phone number request detected: "${messageText}" in chat ${chatId}`);
      
      const phoneMessage = `take their number - call them ${phoneRequest.name}: ${phoneRequest.number}`;
      
      await bot.sendMessage(chatId, phoneMessage, {
        disable_web_page_preview: true
      });
      return;
    } catch (error) {
      console.error('Error processing phone number request:', error);
    }
  }
  
  // Check if the message contains any trigger words
  const hasTriggerWord = triggerWords.some(trigger => 
    messageText.toLowerCase().includes(trigger.toLowerCase())
  );
  
  if (hasTriggerWord) {
    try {
      console.log(`Trigger word detected: "${messageText}" in chat ${chatId}`);
      
      // Send a typing indicator
      bot.sendChatAction(chatId, 'typing');
      
      // Get chat administrators
      const admins = await getChatAdministrators(chatId);
      
      if (admins.length > 0) {
        const tagMessage = createTagMessage(admins);
        
        // Send the tagged message
        await bot.sendMessage(chatId, tagMessage, {
          parse_mode: 'Markdown',
          disable_web_page_preview: true
        });
      } else {
        await bot.sendMessage(chatId, "Sorry, I couldn't retrieve the administrator list for this group. Make sure I have the necessary permissions.");
      }
      
    } catch (error) {
      console.error('Error processing tag request:', error);
      await bot.sendMessage(chatId, "Sorry, there was an error while trying to tag administrators. Please check my permissions.");
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
console.log('🤖 Enhanced Telegram Tag Bot is starting...');
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