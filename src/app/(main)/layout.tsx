import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import ChatSidebar from "@/components/layout/ChatSidebar";
import BalanceProvider from "@/components/layout/BalanceProvider";
import SiteConfigProvider from "@/components/layout/SiteConfigProvider";
import PageTransition from "@/components/layout/PageTransition";
import ToastContainer from "@/components/ui/ToastContainer";
import BigWinOverlay from "@/components/ui/BigWinOverlay";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BalanceProvider>
      <SiteConfigProvider>
        <div className="h-screen flex flex-col">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              <PageTransition>{children}</PageTransition>
            </main>
            <ChatSidebar />
          </div>
        </div>
        <ToastContainer />
        <BigWinOverlay />
      </SiteConfigProvider>
    </BalanceProvider>
  );
}
