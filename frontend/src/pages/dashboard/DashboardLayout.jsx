import { useEffect, useMemo, useRef, useState } from "react";















import {







  AlertCircle,







  AlertTriangle,







  BarChart3,







  Bell,







  Check,







  CheckCheck,







  FileCheck2,







  FileText,







  Grid2X2,







  LogOut,







  Menu,







  Moon,







  RefreshCw,







  Settings,







  Sparkles,







  Sun,







  Target,







  UserCircle,







  X,







} from "lucide-react";















import {







  NavLink,







  useLocation,







  useNavigate,







} from "react-router-dom";















import {







  getCurrentUser,







  removeAccessToken,







} from "../../services/authService";















import {



  clearReadNotifications,



  getNotifications,







  markAllNotificationsAsRead,







  markNotificationAsRead,







} from "../../services/notificationService";















import { useToast } from "../../components/toast/ToastContext";















import "./DashboardLayout.css";















const THEME_KEY = "resumeiq-theme";







const THEME_CHANGE_EVENT = "resumeiq-theme-change";







const NOTIFICATION_REFRESH_MS = 30000;



const NOTIFICATIONS_UPDATED_EVENT = "resumeiq:notifications-updated";















function getInitials(user) {







  const name =







    user?.full_name ||







    user?.name ||







    user?.username ||







    "ResumeIQ User";















  const parts = String(name)







    .trim()







    .split(/\s+/)







    .filter(Boolean);















  if (parts.length >= 2) {







    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();







  }















  return String(parts[0]?.slice(0, 2) || "RI").toUpperCase();







}















function getUserName(user) {







  return (







    user?.full_name ||







    user?.name ||







    user?.username ||







    "ResumeIQ User"







  );







}















function getUserEmail(user) {







  return user?.email || "";







}







function formatNotificationTime(value) {



  if (!value) {



    return "";



  }







  const rawValue = String(value).trim();







  if (!rawValue) {



    return "";



  }







  let normalizedValue = rawValue;







  /*



   \* Backend returns UTC timestamps without a timezone suffix.



   \*



   \* Example:



   \* 2026-10-08T08:30:00



   \*



   \* Treat that value as UTC by adding "Z".



   \*



   \* If the backend already sends Z or an explicit timezone



   \* offset, keep it unchanged.



   */



  if (



    !normalizedValue.endsWith("Z") &&



    !/[+-]\d{2}:\d{2}$/.test(normalizedValue)



  ) {



    normalizedValue = `${normalizedValue}Z`;



  }







  const date = new Date(normalizedValue);







  if (Number.isNaN(date.getTime())) {



    return "";



  }







  const diff = Math.max(0, Date.now() - date.getTime());







  const seconds = Math.floor(diff / 1000);



  const minutes = Math.floor(diff / 60000);



  const hours = Math.floor(diff / 3600000);



  const days = Math.floor(diff / 86400000);







  if (seconds < 60) {



    return "Just now";



  }







  if (minutes < 60) {



    return `${minutes}m ago`;



  }







  if (hours < 24) {



    return `${hours}h ago`;



  }







  if (days < 7) {



    return `${days}d ago`;



  }







  return date.toLocaleDateString("en-IN", {



    day: "numeric",



    month: "short",



    year:



      date.getFullYear() !== new Date().getFullYear()



        ? "numeric"



        : undefined,



  });



}















function getNotificationIcon(type) {







  switch (type) {







    case "resume_uploaded":







      return FileText;







    case "resume_parsed":







      return FileCheck2;







    case "ai_analysis_completed":







      return Sparkles;







    case "job_match_completed":







      return Target;







    default:







      return Bell;







  }







}















function getNotificationRoute(type) {







  switch (type) {







    case "resume_uploaded":







    case "resume_parsed":







      return "/resumes";







    case "ai_analysis_completed":







      return "/analysis";







    case "job_match_completed":







      return "/job-matches";







    default:







      return null;







  }







}















function normalizeNotifications(data) {







  const notifications = Array.isArray(data?.notifications)







    ? data.notifications







    : [];















  return notifications.map((notification) => ({







    id: notification.id,







    type: notification.type || "info",







    title: notification.title || "Notification",







    message: notification.message || "",







    isRead: Boolean(notification.is_read),







    createdAt: notification.created_at,







  }));







}















function DashboardLayout({ children }) {







  const navigate = useNavigate();







  const location = useLocation();







  const notificationRef = useRef(null);















  const {







    success,







    error: showError,







    info,







  } = useToast();















  const [user, setUser] = useState(null);







  const [sidebarOpen, setSidebarOpen] = useState(false);







  const [showLogoutModal, setShowLogoutModal] = useState(false);







  const [theme, setTheme] = useState(() => {







    const savedTheme = localStorage.getItem(THEME_KEY);







    return savedTheme === "light" ? "light" : "dark";







  });















  const [notificationsOpen, setNotificationsOpen] = useState(false);







  const [notifications, setNotifications] = useState([]);







  const [unreadCount, setUnreadCount] = useState(0);







  const [notificationsLoading, setNotificationsLoading] = useState(false);







  const [notificationsError, setNotificationsError] = useState("");







  const [markingNotificationId, setMarkingNotificationId] = useState(null);







  const [markingAll, setMarkingAll] = useState(false);





  const [clearingRead, setClearingRead] = useState(false);















  const navigation = useMemo(







    () => [







      { label: "Dashboard", path: "/dashboard", icon: Grid2X2 },







      { label: "My Resumes", path: "/resumes", icon: FileText },







      { label: "AI Analysis", path: "/analysis", icon: Target },







      { label: "Job Matching", path: "/job-matches", icon: Target },







      { label: "Analytics", path: "/analytics", icon: BarChart3 },







    ],







    []







  );















  useEffect(() => {







    let mounted = true;















    async function loadUser() {







      try {







        const currentUser = await getCurrentUser();







        if (mounted) setUser(currentUser);







      } catch {







        if (mounted) setUser(null);







      }







    }















    loadUser();















    return () => {







      mounted = false;







    };







  }, []);















  async function loadNotifications({ silent = false } = {}) {







    if (!silent) {







      setNotificationsLoading(true);







    }















    try {







      const data = await getNotifications(30);







      setNotifications(normalizeNotifications(data));







      setUnreadCount(Number(data?.unread_count) || 0);







      setNotificationsError("");







    } catch (error) {







      setNotificationsError(







        error instanceof Error







          ? error.message







          : "Unable to load notifications."







      );







    } finally {







      if (!silent) {







        setNotificationsLoading(false);







      }







    }







  }















  useEffect(() => {







    loadNotifications();















    const interval = window.setInterval(() => {







      loadNotifications({ silent: true });







    }, NOTIFICATION_REFRESH_MS);















    return () => window.clearInterval(interval);







  }, []);















  useEffect(() => {



    function handleNotificationsUpdated() {



      loadNotifications({ silent: true });



    }







    window.addEventListener(



      NOTIFICATIONS_UPDATED_EVENT,



      handleNotificationsUpdated



    );







    return () => {



      window.removeEventListener(



        NOTIFICATIONS_UPDATED_EVENT,



        handleNotificationsUpdated



      );



    };



  }, []);







  useEffect(() => {







    const savedTheme =







      localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";















    setTheme(savedTheme);







    document.documentElement.setAttribute("data-theme", savedTheme);







    document.documentElement.setAttribute("data-resumeiq-theme", savedTheme);







  }, []);















  useEffect(() => {







    function handleThemeChange(event) {







      const nextTheme =







        event?.detail === "light"







          ? "light"







          : event?.detail === "dark"







            ? "dark"







            : localStorage.getItem(THEME_KEY) === "light"







              ? "light"







              : "dark";















      setTheme(nextTheme);







      document.documentElement.setAttribute("data-theme", nextTheme);







      document.documentElement.setAttribute("data-resumeiq-theme", nextTheme);







    }















    window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);















    return () => {







      window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);







    };







  }, []);















  useEffect(() => {







    setSidebarOpen(false);







  }, [location.pathname]);















  useEffect(() => {







    function handleDocumentMouseDown(event) {







      if (







        notificationsOpen &&







        notificationRef.current &&







        !notificationRef.current.contains(event.target)







      ) {







        setNotificationsOpen(false);







      }







    }















    document.addEventListener("mousedown", handleDocumentMouseDown);















    return () => {







      document.removeEventListener("mousedown", handleDocumentMouseDown);







    };







  }, [notificationsOpen]);















  useEffect(() => {







    function handleEscape(event) {







      if (event.key !== "Escape") return;















      if (notificationsOpen) {







        setNotificationsOpen(false);







      }















      if (showLogoutModal) {







        setShowLogoutModal(false);







      }







    }















    document.addEventListener("keydown", handleEscape);















    return () => {







      document.removeEventListener("keydown", handleEscape);







    };







  }, [notificationsOpen, showLogoutModal]);















  function toggleTheme() {







    const nextTheme = theme === "dark" ? "light" : "dark";















    setTheme(nextTheme);







    localStorage.setItem(THEME_KEY, nextTheme);







    document.documentElement.setAttribute("data-theme", nextTheme);







    document.documentElement.setAttribute("data-resumeiq-theme", nextTheme);















    window.dispatchEvent(







      new CustomEvent(THEME_CHANGE_EVENT, { detail: nextTheme })







    );















    info(nextTheme === "dark" ? "Dark theme enabled." : "Light theme enabled.");







  }















  function toggleNotifications() {







    setNotificationsOpen((current) => !current);







  }















  async function handleNotificationRead(notification) {







    if (notification.isRead || markingNotificationId === notification.id) {







      const route = getNotificationRoute(notification.type);







      if (route) {







        setNotificationsOpen(false);







        navigate(route);







      }







      return;







    }















    setMarkingNotificationId(notification.id);















    try {







      await markNotificationAsRead(notification.id);















      setNotifications((current) =>







        current.map((item) =>







          item.id === notification.id ? { ...item, isRead: true } : item







        )







      );







      setUnreadCount((current) => Math.max(0, current - 1));















      const route = getNotificationRoute(notification.type);







      setNotificationsOpen(false);







      if (route) navigate(route);







    } catch (error) {







      showError(







        error instanceof Error







          ? error.message







          : "Unable to mark notification as read."







      );







    } finally {







      setMarkingNotificationId(null);







    }







  }















  async function handleMarkAllRead() {







    if (unreadCount === 0 || markingAll) return;















    setMarkingAll(true);















    try {







      await markAllNotificationsAsRead();







      setNotifications((current) =>







        current.map((item) => ({ ...item, isRead: true }))







      );







      setUnreadCount(0);







      success("All notifications marked as read.");







    } catch (error) {







      showError(







        error instanceof Error







          ? error.message







          : "Unable to mark notifications as read."







      );







    } finally {







      setMarkingAll(false);







    }







  }















  async function handleClearRead() {



    const readCount = notifications.filter((item) => item.isRead).length;







    if (readCount === 0 || clearingRead) return;







    setClearingRead(true);







    try {



      await clearReadNotifications();







      setNotifications((current) =>



        current.filter((item) => !item.isRead)



      );



      success(



        readCount === 1



          ? "1 read notification cleared."



          : `${readCount} read notifications cleared.`



      );



    } catch (error) {



      showError(



        error instanceof Error



          ? error.message



          : "Unable to clear read notifications."



      );



    } finally {



      setClearingRead(false);



    }



  }







  function handleLogoutClick() {







    setNotificationsOpen(false);







    setShowLogoutModal(true);







  }















  function confirmLogout() {







    try {







      removeAccessToken();







      setUser(null);







      setShowLogoutModal(false);







      success("Signed out successfully.");







      navigate("/login", { replace: true });







    } catch {







      showError("Unable to sign out completely. Please try again.");







    }







  }















  function cancelLogout() {







    setShowLogoutModal(false);







  }















  function openSettings() {







    setNotificationsOpen(false);







    navigate("/settings");







  }















  function goToDashboard() {







    navigate("/dashboard");







  }
















  useEffect(() => {
    function handleLogoutRequest() {
      setNotificationsOpen(false);
      setShowLogoutModal(true);
    }

    window.addEventListener(
      "resumeiq:request-logout",
      handleLogoutRequest
    );

    return () => {
      window.removeEventListener(
        "resumeiq:request-logout",
        handleLogoutRequest
      );
    };
  }, []);
  return (







    <div className="dashboard-layout">







      <header className="dashboard-topbar">







        <div className="dashboard-topbar__left">







          <button







            type="button"







            className="dashboard-menu-button"







            onClick={() => setSidebarOpen((current) => !current)}







            aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}







          >







            {sidebarOpen ? <X size={19} /> : <Menu size={19} />}







          </button>















          <button







            type="button"







            className="dashboard-logo"







            onClick={goToDashboard}







            aria-label="Go to dashboard"







          >







            <span className="dashboard-logo__mark">







              <FileText size={20} />







            </span>







            <span className="dashboard-logo__text">ResumeIQ</span>







          </button>







        </div>















        <div className="dashboard-topbar__right">







          <div className="dashboard-notification" ref={notificationRef}>







            <button







              type="button"







              className="dashboard-notification-button"







              onClick={toggleNotifications}







              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}







              aria-expanded={notificationsOpen}







              aria-haspopup="true"







              title="Notifications"







            >







              <Bell size={18} strokeWidth={1.9} />







              {unreadCount > 0 && (







                <span className="dashboard-notification-button__badge">







                  {unreadCount > 99 ? "99+" : unreadCount}







                </span>







              )}







            </button>















            {notificationsOpen && (







              <div







                className="dashboard-notification-dropdown"







                role="dialog"







                aria-label="Notifications"







              >







                <div className="dashboard-notification-dropdown__header">







                  <div>







                    <h2>Notifications</h2>







                    <p>







                      {unreadCount > 0







                        ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`







                        : "You're all caught up"}







                    </p>







                  </div>















                  <button







                    type="button"







                    className="dashboard-notification-mark-all"







                    onClick={handleMarkAllRead}







                    disabled={unreadCount === 0 || markingAll}







                    title="Mark all as read"







                  >







                    {markingAll ? (







                      <RefreshCw size={15} className="dashboard-notification-spin" />







                    ) : (







                      <CheckCheck size={15} />







                    )}







                    <span>Mark all read</span>







                  </button>







                </div>















                <div className="dashboard-notification-list">







                  {notificationsLoading ? (







                    <div className="dashboard-notification-state">







                      <RefreshCw size={22} className="dashboard-notification-spin" />







                      <strong>Loading notifications</strong>







                      <span>Checking your latest activity.</span>







                    </div>







                  ) : notificationsError ? (







                    <div className="dashboard-notification-state dashboard-notification-state--error">







                      <AlertCircle size={22} />







                      <strong>Unable to load notifications</strong>







                      <span>{notificationsError}</span>







                      <button type="button" onClick={() => loadNotifications()}>







                        <RefreshCw size={15} />







                        Try again







                      </button>







                    </div>







                  ) : notifications.length === 0 ? (







                    <div className="dashboard-notification-state">







                      <Bell size={24} />







                      <strong>No notifications yet</strong>







                      <span>New ResumeIQ activity will appear here.</span>







                    </div>







                  ) : (







                    notifications.map((notification) => {







                      const Icon = getNotificationIcon(notification.type);







                      const isMarking = markingNotificationId === notification.id;







                      const route = getNotificationRoute(notification.type);















                      return (







                        <button







                          type="button"







                          key={notification.id}







                          className={`dashboard-notification-item ${







                            notification.isRead







                              ? ""







                              : "dashboard-notification-item--unread"







                          }`}







                          onClick={() => handleNotificationRead(notification)}







                          disabled={isMarking}







                        >







                          <span className="dashboard-notification-item__icon">







                            {isMarking ? (







                              <RefreshCw size={17} className="dashboard-notification-spin" />







                            ) : (







                              <Icon size={17} />







                            )}







                          </span>















                          <span className="dashboard-notification-item__content">







                            <span className="dashboard-notification-item__title">







                              {notification.title}







                            </span>







                            <span className="dashboard-notification-item__message">







                              {notification.message}







                            </span>







                            <span className="dashboard-notification-item__meta">







                              <span>{formatNotificationTime(notification.createdAt)}</span>







                              {!notification.isRead && <span className="dashboard-notification-item__unread">New</span>}







                              {route && <span className="dashboard-notification-item__open">Open</span>}







                            </span>







                          </span>















                          {!notification.isRead && (







                            <span







                              className="dashboard-notification-item__indicator"







                              aria-label="Unread"







                            />







                          )}















                          {notification.isRead && (







                            <Check size={15} className="dashboard-notification-item__read" />







                          )}







                        </button>







                      );







                    })







                  )}







                </div>















                <div



                  className="dashboard-notification-dropdown__footer"



                  style={{ gap: "14px" }}



                >



                  <button



                    type="button"



                    onClick={handleClearRead}



                    disabled={



                      clearingRead ||



                      !notifications.some((item) => item.isRead)



                    }



                    title="Clear read notifications"



                    aria-label="Clear read notifications"



                  >



                    {clearingRead ? (



                      <RefreshCw



                        size={14}



                        className="dashboard-notification-spin"



                      />



                    ) : (



                      <X size={14} />



                    )}



                    Clear read



                  </button>



                  <button



                    type="button"



                    onClick={() => loadNotifications()}



                    disabled={notificationsLoading}



                  >



                    <RefreshCw



                      size={14}



                      className={notificationsLoading ? "dashboard-notification-spin" : ""}



                    />



                    Refresh



                  </button>



                </div>







              </div>







            )}







          </div>















          <button







            type="button"







            className="dashboard-theme-button"







            onClick={toggleTheme}







            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}







            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}







          >







            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}







          </button>















          <button







            type="button"







            className="dashboard-profile"







            onClick={openSettings}







            aria-label="Open account settings"







          >







            <span className="dashboard-profile__avatar">{getInitials(user)}</span>







            <span className="dashboard-profile__info">







              <strong>{getUserName(user)}</strong>







              <span>{getUserEmail(user)}</span>







            </span>







          </button>







        </div>







      </header>















      {sidebarOpen && (







        <button







          type="button"







          className="dashboard-sidebar-overlay"







          onClick={() => setSidebarOpen(false)}







          aria-label="Close navigation"







        />







      )}















      <aside







        className={`dashboard-sidebar ${sidebarOpen ? "dashboard-sidebar--open" : ""}`}







      >







        <div className="dashboard-sidebar__content">







          <section className="dashboard-sidebar__section">







            <div className="dashboard-sidebar__label">WORKSPACE</div>







            <nav className="dashboard-navigation">







              {navigation.map(({ label, path, icon: Icon }) => (







                <NavLink







                  key={path}







                  to={path}







                  className={({ isActive }) =>







                    [







                      "dashboard-navigation__item",







                      isActive ? "dashboard-navigation__item--active" : "",







                    ]







                      .filter(Boolean)







                      .join(" ")







                  }







                >







                  <Icon size={18} />







                  <span>{label}</span>







                </NavLink>







              ))}







            </nav>







          </section>















          <section className="dashboard-sidebar__bottom">







            <div className="dashboard-sidebar__label">ACCOUNT</div>















            <NavLink







              to="/settings"







              className={({ isActive }) =>







                [







                  "dashboard-navigation__item",







                  isActive ? "dashboard-navigation__item--active" : "",







                ]







                  .filter(Boolean)







                  .join(" ")







              }







            >







              <Settings size={18} />







              <span>Settings</span>







            </NavLink>















            <button







              type="button"







              className="dashboard-navigation__logout"







              onClick={handleLogoutClick}







            >







              <LogOut size={18} />







              <span>Sign out</span>







            </button>







          </section>







        </div>















        <button







          type="button"







          className="dashboard-sidebar__user"







          onClick={openSettings}







          aria-label="Open account settings"







        >







          <span className="dashboard-sidebar__user-avatar">{getInitials(user)}</span>







          <span className="dashboard-sidebar__user-info">







            <strong>{getUserName(user)}</strong>







            <span>{getUserEmail(user)}</span>







          </span>







          <span className="dashboard-sidebar__user-icon" aria-hidden="true">







            <UserCircle size={19} />







          </span>







        </button>







      </aside>















      <main className="dashboard-content">{children}</main>















      {showLogoutModal && (







        <div







          className="dashboard-logout-overlay"







          role="presentation"







          onMouseDown={(event) => {







            if (event.target === event.currentTarget) cancelLogout();







          }}







        >







          <div







            className="dashboard-logout-modal"







            role="dialog"







            aria-modal="true"







            aria-labelledby="logout-modal-title"







            aria-describedby="logout-modal-description"







          >







            <div className="dashboard-logout-modal__icon">







              <AlertTriangle size={22} />







            </div>















            <div className="dashboard-logout-modal__content">







              <h2 id="logout-modal-title">Sign out?</h2>







              <p id="logout-modal-description">







                Are you sure you want to sign out of your ResumeIQ account?







              </p>







            </div>















            <div className="dashboard-logout-modal__actions">







              <button







                type="button"







                className="dashboard-logout-modal__cancel"







                onClick={cancelLogout}







              >







                Cancel







              </button>







              <button







                type="button"







                className="dashboard-logout-modal__confirm"







                onClick={confirmLogout}







              >







                <LogOut size={16} />







                <span>Sign out</span>







              </button>







            </div>







          </div>







        </div>







      )}







    </div>







  );







}















export default DashboardLayout;

