const Settings = require('../modules/settings/settings.model');

/**
 * Sends a dynamic Telegram notification based on the store event.
 * Wrapped in a try/catch so it never disrupts the main application flow.
 * 
 * @param {string} messageType - The type of notification (e.g. 'NEW_ORDER_EXISTING')
 * @param {object} payload - The data associated with the event
 */
exports.sendTelegramNotification = async (messageType, payload) => {
  try {
    const settings = await Settings.findOne();
    if (!settings || !settings.telegramSettings) return;
    
    const { botToken, chatId } = settings.telegramSettings;
    if (!botToken || !chatId) return;

    let shouldSend = false;
    let message = '';

    switch(messageType) {
      case 'NEW_ORDER_EXISTING':
        shouldSend = settings.telegramSettings.notifyNewOrderExistingUser;
        message = `🛍️ <b>New Order (Existing User)</b>
<b>Invoice:</b> #${payload.orderId || payload.invoice}
<b>Total Amount:</b> ৳${payload.totalAmount}
<b>Customer Name:</b> ${payload.customerName}
<b>Items:</b>
${payload.items ? payload.items.map(item => `- ${item.productTitle} (x${item.quantity})`).join('\n') : 'N/A'}`;
        break;

      case 'NEW_ORDER_GUEST':
        shouldSend = settings.telegramSettings.notifyNewOrderGuestUser;
        message = `🛍️ <b>New Order (Guest User)</b>
<b>Invoice:</b> #${payload.orderId || payload.invoice}
<b>Total Amount:</b> ৳${payload.totalAmount}
<b>Customer Name:</b> ${payload.customerName}
<b>Items:</b>
${payload.items ? payload.items.map(item => `- ${item.productTitle} (x${item.quantity})`).join('\n') : 'N/A'}`;
        break;

      case 'NEW_USER_SIGNUP':
        shouldSend = settings.telegramSettings.notifyNewUserSignup;
        message = `👤 <b>New User Signup</b>
<b>Name:</b> ${payload.name || 'Unknown'}
<b>Contact:</b> ${payload.identifier || 'Unknown'}
<b>Method:</b> ${payload.method || 'Standard'}`;
        break;

      case 'PASSWORD_CHANGE':
        shouldSend = settings.telegramSettings.notifyPasswordChange;
        message = `🔒 <b>User Password Changed / Reset</b>
<b>Contact:</b> ${payload.identifier || 'Unknown'}`;
        break;
        
      default:
        return;
    }

    if (shouldSend && message) {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      // Use dynamic import for node-fetch if running on older Node versions without native fetch, 
      // but native fetch is available in Node 18+. Since we used fetch in steadfast.controller.js, we can use it here.
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' })
      });
    }
  } catch (error) {
    console.error('Telegram Notification Error:', error);
  }
};
