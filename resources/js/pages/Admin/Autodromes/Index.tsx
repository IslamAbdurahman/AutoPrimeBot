import { useState, useRef, useMemo, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Trash2, Edit2, Plus, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

// Fix leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Autodrome {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    radius_meters: number;
    completed_drivings_count?: number;
}

interface PageProps {
    autodromes: Autodrome[];
}

function LocationMarker({ position, setPosition, radius }: { position: L.LatLng | null, setPosition: (p: L.LatLng) => void, radius: number }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng);
        },
    });

    return position === null ? null : (
        <>
            <Marker position={position}></Marker>
            <Circle center={position} pathOptions={{ fillColor: 'blue' }} radius={radius} />
        </>
    );
}

function MapController({ center }: { center: L.LatLng | null }) {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, 15, { animate: true });
        }
    }, [center, map]);
    return null;
}

export default function AutodromesIndex({ autodromes }: PageProps) {
    const { t } = useTranslation();
    const [editing, setEditing] = useState<Autodrome | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [locating, setLocating] = useState(false);
    
    // Default to Tashkent coordinates if no position is selected
    const defaultCenter = useMemo(() => new L.LatLng(41.2995, 69.2401), []);
    const [position, setPosition] = useState<L.LatLng | null>(null);

    const { data, setData, post, put, delete: destroy, reset, errors, processing } = useForm({
        name: '',
        latitude: '',
        longitude: '',
        radius_meters: '100',
    });

    useEffect(() => {
        if (showForm && !editing && !position) {
            if (navigator.geolocation) {
                setLocating(true);
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const userLatLng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
                        setPosition(userLatLng);
                        setLocating(false);
                        toast.success(t('autodromes.location_found', 'Hozirgi joylashuvingiz belgilandi'));
                    },
                    (err) => {
                        setLocating(false);
                        console.log('Location error:', err);
                    },
                    { enableHighAccuracy: true, timeout: 8000 }
                );
            }
        }
    }, [showForm, editing]);

    useEffect(() => {
        if (position) {
            setData((prev) => ({
                ...prev,
                latitude: String(position.lat),
                longitude: String(position.lng)
            }));
        }
    }, [position]);

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            toast.error("Qurilmangizda geolokatsiya qo'llab-quvvatlanmaydi");
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const userLatLng = new L.LatLng(pos.coords.latitude, pos.coords.longitude);
                setPosition(userLatLng);
                setLocating(false);
                toast.success(t('autodromes.location_found', 'Hozirgi joylashuvingiz belgilandi'));
            },
            (err) => {
                setLocating(false);
                toast.error("Joylashuvni aniqlab bo'lmadi: " + err.message);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            put('/admin/autodromes/' + editing.id, {
                onSuccess: () => {
                    closeForm();
                    toast.success(t('autodromes.edit', 'Avtodrom yangilandi'));
                },
                onError: (err) => toast.error(Object.values(err)[0] || t('drivings.error', 'Xatolik yuz berdi')),
            });
        } else {
            post('/admin/autodromes', {
                onSuccess: () => {
                    closeForm();
                    toast.success(t('autodromes.new', 'Avtodrom yaratildi'));
                },
                onError: (err) => toast.error(Object.values(err)[0] || t('drivings.error', 'Xatolik yuz berdi')),
            });
        }
    };

    const handleEdit = (autodrome: Autodrome) => {
        setEditing(autodrome);
        setData({
            name: autodrome.name,
            latitude: String(autodrome.latitude),
            longitude: String(autodrome.longitude),
            radius_meters: String(autodrome.radius_meters),
        });
        setPosition(new L.LatLng(autodrome.latitude, autodrome.longitude));
        setShowForm(true);
    };

    const handleDelete = (id: number) => {
        if (confirm(t('common.confirm_delete', "Rostdan ham o'chirmoqchimisiz?"))) {
            destroy('/admin/autodromes/' + id, {
                onSuccess: () => toast.success(t('common.delete', "O'chirildi")),
                onError: (err) => toast.error(Object.values(err)[0] || t('drivings.error', 'Xatolik yuz berdi')),
            });
        }
    };

    const closeForm = () => {
        setShowForm(false);
        setTimeout(() => {
            setEditing(null);
            setPosition(null);
            reset();
        }, 300);
    };

    return (
        <div className="p-6">
            <Head title={t('autodromes.title', 'Avtodromlar')} />
            
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('autodromes.title', 'Avtodromlar')}</h1>
                    <p className="text-muted-foreground">{t('autodromes.description', "Mashg'ulotlar o'tkaziladigan maxsus maydonlar va ularning radiuslari")}</p>
                </div>
                <Button onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-2" /> {t('common.add', "Qo'shish")}</Button>
            </div>

            <Dialog open={showForm} onOpenChange={(open) => !open && closeForm()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? t('autodromes.edit', 'Avtodromni tahrirlash') : t('autodromes.new', 'Yangi Avtodrom')}</DialogTitle>
                        <DialogDescription className="sr-only">
                            {editing ? t('common.edit', 'Tahrirlash') : t('common.add', "Qo'shish")}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="name">{t('autodromes.name', 'Nomi')}</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Masalan: Asosiy avtodrom" required />
                                {errors.name && <div className="text-destructive text-sm mt-1">{errors.name}</div>}
                            </div>
                            <div>
                                <Label htmlFor="radius_meters">{t('autodromes.radius_label', 'Radius (metrda)')}</Label>
                                <Input type="number" id="radius_meters" value={data.radius_meters} onChange={e => setData('radius_meters', e.target.value)} placeholder="Masalan: 100" required min="10" />
                                {errors.radius_meters && <div className="text-destructive text-sm mt-1">{errors.radius_meters}</div>}
                            </div>
                        </div>

                        <div className="border rounded-xl p-2 bg-gray-50 h-[400px]">
                            <div className="flex justify-between items-center mb-2 px-1">
                                <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> 
                                    {t('autodromes.map_hint', 'Xaritadan joyni tanlang (ustiga bosing)')}
                                </p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLocateMe}
                                    disabled={locating}
                                    className="h-8 text-xs bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                >
                                    {locating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Navigation className="w-3.5 h-3.5 mr-1" />}
                                    {t('autodromes.locate_me', 'Hozirgi joylashuvim')}
                                </Button>
                            </div>
                            <MapContainer 
                                center={position || defaultCenter} 
                                zoom={position ? 15 : 12} 
                                style={{ height: 'calc(100% - 36px)', width: '100%', borderRadius: '0.5rem' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapController center={position} />
                                <LocationMarker 
                                    position={position} 
                                    setPosition={setPosition} 
                                    radius={Number(data.radius_meters) || 100} 
                                />
                            </MapContainer>
                        </div>
                        
                        {(errors.latitude || errors.longitude) && (
                            <div className="text-destructive text-sm">{t('autodromes.location_required', 'Xaritadan manzilni belgilash majburiy.')}</div>
                        )}

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={closeForm}>{t('common.cancel', 'Bekor qilish')}</Button>
                            <Button type="submit" disabled={processing || !position}>{t('common.save', 'Saqlash')}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                {/* Desktop Table */}
                <table className="hidden md:table w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                        <tr>
                            <th className="px-4 py-3 font-medium">{t('common.number', '№')}</th>
                            <th className="px-4 py-3 font-medium">{t('autodromes.name', 'Nomi')}</th>
                            <th className="px-4 py-3 font-medium">{t('autodromes.coordinates', 'Kordinatalar')}</th>
                            <th className="px-4 py-3 font-medium">{t('autodromes.radius', 'Radius (metr)')}</th>
                            <th className="px-4 py-3 font-medium text-center">{t('autodromes.completed_drivings', 'Tugagan darslar')}</th>
                            <th className="px-4 py-3 text-right font-medium">{t('common.actions', 'Amallar')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {autodromes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('common.no_data', "Ma'lumot topilmadi")}</td>
                            </tr>
                        ) : (
                            autodromes.map((item, index) => (
                                <tr key={item.id} className="hover:bg-muted/30">
                                    <td className="px-4 py-3">{index + 1}</td>
                                    <td className="px-4 py-3 font-medium">{item.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {item.latitude}, {item.longitude}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-blue-600">{item.radius_meters}m</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                            {item.completed_drivings_count || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                <Edit2 className="w-4 h-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y">
                    {autodromes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                            {t('common.no_data', 'Ma\'lumot topilmadi')}
                        </div>
                    ) : (
                        autodromes.map((item) => (
                            <div key={item.id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-lg">{item.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                            {item.latitude}, {item.longitude}
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        Radius: {item.radius_meters}m
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm pt-2 border-t">
                                    <span className="text-muted-foreground text-xs">{t('autodromes.completed_drivings', 'Tugagan darslar')}:</span>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        {item.completed_drivings_count || 0}
                                    </span>
                                </div>

                                <div className="flex gap-2 justify-end pt-1">
                                    <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                                        <Edit2 className="w-4 h-4 mr-1.5 text-blue-500" /> {t('common.edit', 'Tahrirlash')}
                                    </Button>
                                    <Button variant="outline" size="sm" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
