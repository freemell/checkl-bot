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

// Active reminders storage
const activeReminders = new Map();

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

// Function to parse time from reminder message
function parseReminderTime(messageText) {
  const lowerMessage = messageText.toLowerCase();
  
  // Check for "remind me in" pattern
  const remindMatch = lowerMessage.match(/remind me in (\d+)\s*(day|days|hour|hours|minute|minutes|second|seconds)/);
  if (remindMatch) {
    const amount = parseInt(remindMatch[1]);
    const unit = remindMatch[2];
    
    let milliseconds = 0;
    switch (unit) {
      case 'day':
      case 'days':
        milliseconds = amount * 24 * 60 * 60 * 1000;
        break;
      case 'hour':
      case 'hours':
        milliseconds = amount * 60 * 60 * 1000;
        break;
      case 'minute':
      case 'minutes':
        milliseconds = amount * 60 * 1000;
        break;
      case 'second':
      case 'seconds':
        milliseconds = amount * 1000;
        break;
    }
    
    return {
      time: milliseconds,
      message: messageText.replace(/remind me in \d+\s*(day|days|hour|hours|minute|minutes|second|seconds)/i, '').trim()
    };
  }
  
  return null;
}

// Function to set a reminder
function setReminder(chatId, userId, reminderData) {
  const reminderId = `${chatId}_${userId}_${Date.now()}`;
  const reminderTime = Date.now() + reminderData.time;
  
  activeReminders.set(reminderId, {
    chatId,
    userId,
    message: reminderData.message,
    time: reminderTime
  });
  
  // Set timeout to send reminder
  setTimeout(() => {
    sendReminder(reminderId);
  }, reminderData.time);
  
  return reminderId;
}

// Function to send reminder
function sendReminder(reminderId) {
  const reminder = activeReminders.get(reminderId);
  if (reminder) {
    bot.sendMessage(reminder.chatId, `⏰ **Reminder:** ${reminder.message}`);
    activeReminders.delete(reminderId);
  }
}

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
  const messageText = msg.text || '';
  const chatType = msg.chat.type;
  
  // Only respond in groups and supergroups
  if (chatType !== 'group' && chatType !== 'supergroup') {
    return;
  }
  
  // Check for reminder requests first
  const reminderData = parseReminderTime(messageText);
  if (reminderData) {
    try {
      console.log(`Reminder request detected: "${messageText}" in chat ${chatId}`);
      
      const reminderId = setReminder(chatId, msg.from.id, reminderData);
      
      const reminderMessage = `⏰ Reminder set! I'll remind you about: "${reminderData.message}"`;
      
      await bot.sendMessage(chatId, reminderMessage, {
        disable_web_page_preview: true
      });
      return;
    } catch (error) {
      console.error('Error processing reminder request:', error);
    }
  }
  
  // Check for phone number requests
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
      
      // Get chat members for tagging
      const mentions = await getChatMembersForTagging(chatId);
      
      if (mentions.length > 0) {
        // Create simple message with mentions and "Hiiii listen"
        const tagMessage = `${mentions.join(' ')} Hiiii listen`;
        
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