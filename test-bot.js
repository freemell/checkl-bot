const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');

async function testBot() {
  try {
    console.log('🔍 Testing bot configuration...');
    
    const bot = new TelegramBot(config.BOT_TOKEN, { polling: false });
    
    // Test the bot token by getting bot info
    const botInfo = await bot.getMe();
    console.log('✅ Bot token is valid!');
    console.log(`🤖 Bot name: ${botInfo.first_name}`);
    console.log(`📝 Bot username: @${botInfo.username}`);
    console.log(`🆔 Bot ID: ${botInfo.id}`);
    
    console.log('\n🚀 Bot is ready to use!');
    console.log('📋 Next steps:');
    console.log('   1. Add the bot to your Telegram group');
    console.log('   2. Make sure it has permission to read and send messages');
    console.log('   3. Type any trigger word like "tag all" or "@all"');
    console.log('   4. Run "npm start" to start the bot');
    
  } catch (error) {
    console.error('❌ Error testing bot:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check if the bot token is correct');
    console.log('   - Make sure the bot hasn\'t been deleted');
    console.log('   - Verify the bot token in config.js');
  }
}

testBot(); 