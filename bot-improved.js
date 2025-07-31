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
function createSimpleTagMessage(members) {
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
      
      // Send a typing indicator
      bot.sendChatAction(chatId, 'typing');
      
      // Get chat members
      const result = await getAllChatMembers(chatId);
      
      if (result.members.length > 0) {
        const tagMessage = createSimpleTagMessage(result.members);
        
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