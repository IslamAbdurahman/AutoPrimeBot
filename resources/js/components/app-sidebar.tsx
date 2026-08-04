import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, MapPin } from 'lucide-react';
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
import type { NavItem, SharedData } from '@/types';

export function AppSidebar() {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;
    const isInstructor = auth.user.role === 'instructor';

    const mainNavItems: NavItem[] = [
        {
            title: t('sidebar.dashboard', 'Bosh sahifa'),
            href: '/admin/dashboard',
            icon: LayoutGrid,
        },
        {
            title: 'Avtodromlar',
            href: '/admin/autodromes',
            icon: MapPin,
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
    ].filter(item => {
        if (isInstructor) {
            return ['/admin/dashboard', '/admin/groups', '/admin/students', '/admin/drivings'].includes(item.href);
        }
        return true;
    });

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
