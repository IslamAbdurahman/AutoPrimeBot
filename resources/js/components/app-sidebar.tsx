import { Link } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { useTranslation } from 'react-i18next';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { t } = useTranslation();

    const mainNavItems: NavItem[] = [
        {
            title: t('sidebar.dashboard', 'KPI Paneli'),
            href: '/admin/kpi',
            icon: LayoutGrid,
        },
        {
            title: t('sidebar.instructors', 'Instruktorlar'),
            href: '/admin/instructors',
            icon: BookOpen,
        },
        {
            title: t('sidebar.groups', 'Guruhlar'),
            href: '/admin/groups',
            icon: FolderGit2,
        },
        {
            title: t('sidebar.students', 'O\'quvchilar'),
            href: '/admin/students',
            icon: BookOpen,
        },
        {
            title: t('sidebar.drivings', 'Mashg\'ulotlar'),
            href: '/admin/drivings',
            icon: FolderGit2,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
