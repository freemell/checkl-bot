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

// Function to get all chat members
async function getChatMembers(chatId) {
  try {
    // Get chat administrators first
    const admins = await bot.getChatAdministrators(chatId);
    
    // For now, we'll use the administrators list
    // Note: Getting all members requires special permissions and may not be available
    // in all Telegram groups due to privacy settings
    return admins;
  } catch (error) {
    console.error('Error getting chat members:', error);
    return [];
  }
}

// Function to create a message with all members tagged
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

// Handle incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text || '';
  const chatType = msg.chat.type;
  
  // Only respond in groups and supergroups
  if (chatType !== 'group' && chatType !== 'supergroup') {
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
      
      // Get all chat members
      const members = await getChatMembers(chatId);
      
      if (members.length > 0) {
        const tagMessage = createTagMessage(members);
        
        // Send the tagged message without Markdown to avoid parsing errors
        await bot.sendMessage(chatId, tagMessage, {
          disable_web_page_preview: true
        });
      } else {
        await bot.sendMessage(chatId, "Sorry, I couldn't retrieve the member list for this group.");
      }
      
    } catch (error) {
      console.error('Error processing tag request:', error);
      await bot.sendMessage(chatId, "Sorry, there was an error while trying to tag everyone.");
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
console.log('🤖 Telegram Tag Bot is starting...');
console.log('📝 Trigger words:');
triggerWords.forEach(word => console.log(`   - "${word}"`));
console.log('✅ Bot is now running and listening for messages...');

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