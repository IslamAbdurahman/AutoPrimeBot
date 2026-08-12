import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links?: PaginationLink[];
}

export default function Pagination({ links }: PaginationProps) {
    const { t } = useTranslation();

    if (!links || links.length <= 3) return null;

    return (
        <div className="flex flex-wrap items-center justify-center gap-1 mt-6">
            {links.map((link, key) => {
                let label = link.label;
                if (label.includes('Previous') || label.includes('pagination.previous')) {
                    label = label.replace(/Previous|pagination\.previous/g, t('pagination.previous', 'Oldingisi'));
                } else if (label.includes('Next') || label.includes('pagination.next')) {
                    label = label.replace(/Next|pagination\.next/g, t('pagination.next', 'Keyingisi'));
                }

                if (link.url === null) {
                    return (
                        <div
                            key={key}
                            className="px-3 py-1 text-sm border rounded text-muted-foreground bg-muted/50"
                            dangerouslySetInnerHTML={{ __html: label }}
                        />
                    );
                }
                return (
                    <Link
                        key={key}
                        href={link.url}
                        className={`px-3 py-1 text-sm border rounded hover:bg-muted ${link.active ? 'bg-primary text-primary-foreground border-primary hover:bg-primary' : 'bg-card'}`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </div>
    );
}
