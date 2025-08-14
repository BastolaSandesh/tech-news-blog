const { WebClient } = require('@slack/web-api');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupSlack() {
  console.log("\n=== Slack Configuration Setup ===\n");
  
  // Get bot token
  const botToken = await new Promise(resolve => {
    rl.question('Enter your Slack Bot Token (starts with xoxb-): ', answer => {
      resolve(answer.trim());
    });
  });

  // Initialize Slack client
  const slack = new WebClient(botToken);

  try {
    // Test authentication
    const auth = await slack.auth.test();
    console.log(`\n✅ Successfully authenticated as: ${auth.user}`);

    // Get channel list
    const channelList = await slack.conversations.list({
      types: 'public_channel,private_channel'
    });

    console.log("\nAvailable channels:");
    channelList.channels.forEach((channel, index) => {
      console.log(`${index + 1}. #${channel.name} (${channel.id})`);
    });

    // Get channel selection
    const channelIndex = await new Promise(resolve => {
      rl.question('\nEnter the number of the channel to use: ', answer => {
        resolve(parseInt(answer.trim()) - 1);
      });
    });

    const selectedChannel = channelList.channels[channelIndex];
    console.log(`\nSelected channel: #${selectedChannel.name}`);

    // Create environment variables
    const envContent = `SLACK_BOT_TOKEN=${botToken}
SLACK_CHANNEL_ID=${selectedChannel.id}`;

    fs.writeFileSync(path.join(__dirname, '.env'), envContent);
    console.log('\n✅ Configuration saved to .env file');

    // Try to join the channel
    try {
      await slack.conversations.join({ channel: selectedChannel.id });
      console.log('✅ Bot joined the channel successfully');
    } catch (error) {
      console.log('⚠️ Note: Bot could not automatically join the channel.');
      console.log('Please manually invite the bot to the channel using /invite @bot_name');
    }

    console.log('\n=== Setup Complete ===');
    console.log('1. The bot token and channel ID have been saved to .env');
    console.log('2. Make sure to invite the bot to your channel if not already done');
    console.log('3. Restart your server to apply the changes');
    
  } catch (error) {
    console.error('Error during setup:', error.message);
  } finally {
    rl.close();
  }
}

setupSlack();
