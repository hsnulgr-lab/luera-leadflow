import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
    return (
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20 px-6 flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">

            </div>

            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
            </div>
        </header>
    );
};
