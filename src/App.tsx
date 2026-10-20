import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SignInScreen } from './components/auth/SignInScreen';
import { SignUpScreen } from './components/auth/SignUpScreen';
import { Sidebar } from './components/navigation/Sidebar';
import { MobileNav } from './components/navigation/MobileNav';
import { AppHeader } from './components/navigation/AppHeader';
import { ConversationList } from './components/chat/ConversationList';
import { ChatArea } from './components/chat/ChatArea';
import { ProfileDrawer } from './components/profile/ProfileDrawer';
import { StoryViewerModal } from './components/stories/StoryViewerModal';
import { ArcadeView } from './components/arcade/ArcadeView';

const MainAppLayout: React.FC = () => {
  const { mobileShowChat, activeView } = useApp();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-technovix-void text-slate-100 font-sans">
      {/* Top Header */}
      <AppHeader />

      {/* Center Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar Rail */}
        <Sidebar />

        {/* Main Content Area: switches between Chat Dashboard and Arcade */}
        {activeView === 'arcade' ? (
          <ArcadeView />
        ) : (
          <div className="flex-1 flex overflow-hidden relative">
            {/* Conversation List Pane */}
            <div
              className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
                mobileShowChat ? 'hidden md:flex flex-col' : 'flex flex-col'
              }`}
            >
              <ConversationList />
            </div>

            {/* Chat Conversation Stage */}
            <div
              className={`flex-1 h-full ${
                mobileShowChat ? 'flex flex-col' : 'hidden md:flex flex-col'
              }`}
            >
              <ChatArea />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation (Visible on phones when chat is not focused) */}
      {!mobileShowChat && <MobileNav />}

      {/* Global Modals & Drawers */}
      <StoryViewerModal />
      <ProfileDrawer />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { activeScreen } = useApp();

  if (activeScreen === 'welcome') {
    return <SignInScreen />;
  }

  if (activeScreen === 'signup') {
    return <SignUpScreen />;
  }

  return <MainAppLayout />;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
