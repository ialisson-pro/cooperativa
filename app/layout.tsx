import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cooper Maceió Saúde",
  description: "Sistema administrativo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100`}
      >
        {/* HEADER - largura total */}
        <header className="h-24 bg-[#d7d0d0] shadow-md flex items-center justify-between px-8">

          {/* LOGO */}
          <div className="flex items-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={180}
              height={90}
            />
          </div>

          {/* PERFIL */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#d01818] flex items-center justify-center text-white font-bold">
              A
            </div>
            <div className="text-sm">
              <p className="font-semibold text-[#d01818]">Admin</p>
              <p className="text-gray-600 text-xs">@email</p>
            </div>
          </div>
        </header>

        {/* CONTEÚDO ABAIXO DO HEADER */}
        <div className="flex h-[calc(100vh-96px)]">
          {/* SIDEBAR */}
          <aside className="w-54 bg-[#00bf63] p-6"> 
            <div>
              <nav className="flex flex-col space-y-4 ">
                <a
                  href="/dashboard"
                  className="text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:text-[#00bf63]"
                >
                  Dashboard
                </a>

                <a
                  href="/pagamentos"
                  className="text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:text-[#00bf63]"
                >
                  Pagamentos
                </a>

                <a
                  href="/clientes"
                  className="text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:text-[#00bf63]"
                >
                  Clientes
                </a>

                <a
                  href="/cuidadores"
                  className="text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:text-[#00bf63]"
                >
                  Cuidadores
                </a>

                <a
                  href="/servicos"
                  className="text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:text-[#00bf63]"
                >
                  Serviços
                </a>

              </nav>
            </div>

            <div className="flex flex-col space-y-4 text-sm mt-55">
              <button className="w-full text-left text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:text-[#00bf63]">
                Configurações
              </button>
              <a 
                href="/login"
                className="w-full text-left text-white font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-white hover:text-[#00bf63]">
                Logout
              </a>
            </div>
          </aside>

          {/* MAIN */}
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>

        </div>
      </body>
    </html>
  );
}