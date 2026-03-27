// src/Pages/customer/components/customer-navbar/sub-components/NotificationPanel.jsx
import "./NotificationPanel.css";

const notifications = [
  {
    text: "Your bid for Project XYZ has been accepted!",
    time: "2 hours ago",
    read: false,
  },
  {
    text: "New design templates available for modern kitchens",
    time: "5 hours ago",
    read: false,
  },
  {
    text: "Weekly report for your ongoing projects is ready",
    time: "Yesterday",
    read: true,
  },
];

const NotificationPanel = () => {
  return (
    <div className="customer_notification_panel">
      <div className="customer_notification_panel_header">
        <div className="customer_notification_panel_title">Notifications</div>
        <div className="customer_notification_panel_markRead">
          Mark all as read
        </div>
      </div>

      {notifications.map((n, i) => (
        <div
          key={i}
          className={`customer_notification_panel_item ${
            n.read ? "customer_notification_panel_item_read" : ""
          }`}
        >
          <div className="customer_notification_panel_content">
            <div className="customer_notification_panel_text">{n.text}</div>
            <div className="customer_notification_panel_time">{n.time}</div>
          </div>
        </div>
      ))}

      <div className="customer_notification_panel_footer">
        <a href="#" className="customer_notification_panel_viewAll">
          View all notifications
        </a>
      </div>
    </div>
  );
};

export default NotificationPanel;
