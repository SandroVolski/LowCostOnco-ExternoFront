import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/contexts/AdminContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import cors from 'cors';

const AdminLogin = () => {
	const [secret, setSecret] = useState('');
	const [showPassword, setShowPassword] = useState(false);
  const { loginAdmin } = useAdmin();
	const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
    if (loginAdmin('OnkoLinkGlobal', secret)) {
			toast.success('Admin autenticado');
      navigate('/admin/clinicas/register');
		} else {
			toast.error('Segredo inválido');
		}
	};

	return (
		<div className="max-w-md mx-auto py-12">
			<Card>
				<CardHeader>
					<CardTitle>Acesso Admin OnkoLink</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>Segredo administrativo</Label>
							<div className="relative">
								<Input 
									type={showPassword ? "text" : "password"} 
									value={secret} 
									onChange={e => setSecret(e.target.value)} 
									placeholder="SENHA_ADMIN"
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4" />
									) : (
										<Eye className="h-4 w-4" />
									)}
								</button>
							</div>
						</div>
						<div className="flex justify-end">
							<Button type="submit" className="lco-btn-primary">Entrar</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default AdminLogin; 