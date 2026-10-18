import type { Metadata } from 'next';
import './globals.css';
import './theme.css';
export const metadata:Metadata={title:'ClausePact — Keep the agreement. Resolve the extra.',description:'Two wallets. One frozen brief. Clause-grounded scope decisions on GenLayer.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}


