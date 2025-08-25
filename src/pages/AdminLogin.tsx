import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/contexts/AdminContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import cors from 'cors';

const AdminLogin = () => {
	const [secret, setSecret] = useState('');
	const { loginAdmin } = useAdmin();
	const navigate = useNavigate();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (loginAdmin(secret)) {
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
					<CardTitle>Acesso Admin Onkhos</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label>Segredo administrativo</Label>
							<Input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="SENHA_ADMIN" />
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