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
  'everyone',
  'tag everyone',
  'call everyone',
  'summon all'
];

// Function to get chat administrators and create simple mentions
async function getChatMembersForTagging(chatId) {
  try {
    const admins = await bot.getChatAdministrators(chatId);
    const mentions = [];
    
    for (const admin of admins) {
      const user = admin.user;
      if (user.username) {
        mentions.push(`@${user.username}`);
      }
    }
    
    return mentions;
  } catch (error) {
    console.error('Error getting chat members:', error);
    return [];
  }
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
  
  // Check if the message contains any trigger words
  const hasTriggerWord = triggerWords.some(trigger => 
    messageText.includes(trigger.toLowerCase())
  );
  
  if (hasTriggerWord) {
    try {
      console.log(`Trigger word detected: "${messageText}" in chat ${chatId}`);
      
      // Get chat members for tagging
      const mentions = await getChatMembersForTagging(chatId);
      
      if (mentions.length > 0) {
        // Create simple message with mentions and "Hi"
        const tagMessage = `${mentions.join(' ')} Hi!`;
        
        // Send the message
        await bot.sendMessage(chatId, tagMessage);
      }
      
    } catch (error) {
      console.error('Error processing tag request:', error);
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
console.log('🤖 Simple Telegram Tag Bot is starting...');
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