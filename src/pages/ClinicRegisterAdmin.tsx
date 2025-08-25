import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ClinicService } from '@/services/clinicService';

const ClinicRegisterAdmin = () => {
	const [form, setForm] = useState({
		nome: '',
		codigo: '',
		usuario: '',
		senha: '',
		email: '',
		telefones: '' as string,
		emails: '' as string,
		status: 'ativo',
		adminSecret: ''
	});
	const [loading, setLoading] = useState(false);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.nome.trim() || !form.codigo.trim()) {
			toast.error('Preencha os campos obrigatórios: nome e código');
			return;
		}
		if (!form.adminSecret.trim()) {
			toast.error('Informe o segredo administrativo (X-Admin-Secret)');
			return;
		}
		setLoading(true);
		try {
			const payload: any = {
				nome: form.nome.trim(),
				codigo: form.codigo.trim(),
				status: form.status,
			};
			if (form.usuario.trim()) payload.usuario = form.usuario.trim();
			if (form.senha.trim()) payload.senha = form.senha;
			if (form.email.trim()) payload.email = form.email.trim();
			if (form.emails.trim()) payload.emails = form.emails.split(',').map(s => s.trim()).filter(Boolean);
			if (form.telefones.trim()) payload.telefones = form.telefones.split(',').map(s => s.trim()).filter(Boolean);
			await ClinicService.registerAdminClinic(payload, form.adminSecret);
			toast.success('Clínica cadastrada com sucesso!');
			setForm({ nome: '', codigo: '', usuario: '', senha: '', email: '', telefones: '', emails: '', status: 'ativo', adminSecret: '' });
		} catch (err: any) {
			toast.error('Erro ao cadastrar clínica', { description: err?.message || 'Tente novamente' });
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Cadastro Administrativo de Clínicas</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Nome *</Label>
							<Input name="nome" value={form.nome} onChange={handleChange} required />
						</div>
						<div className="space-y-2">
							<Label>Código *</Label>
							<Input name="codigo" value={form.codigo} onChange={handleChange} required />
						</div>
						<div className="space-y-2">
							<Label>Usuário (opcional)</Label>
							<Input name="usuario" value={form.usuario} onChange={handleChange} />
						</div>
						<div className="space-y-2">
							<Label>Senha (opcional)</Label>
							<Input type="password" name="senha" value={form.senha} onChange={handleChange} />
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>E-mail (opcional)</Label>
							<Input name="email" value={form.email} onChange={handleChange} placeholder="contato@clinica.com" />
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>E-mails (lista, separados por vírgula, opcional)</Label>
							<Input name="emails" value={form.emails} onChange={handleChange} placeholder="email1@ex.com, email2@ex.com" />
						</div>
						<div className="space-y-2 md:col-span-2">
							<Label>Telefones (lista, separados por vírgula, opcional)</Label>
							<Input name="telefones" value={form.telefones} onChange={handleChange} placeholder="(11) 99999-9999, (11) 98888-7777" />
						</div>
						<div className="space-y-2">
							<Label>Status</Label>
							<Input name="status" value={form.status} onChange={handleChange} />
						</div>
						<div className="space-y-2">
							<Label>Segredo administrativo (X-Admin-Secret)</Label>
							<Input name="adminSecret" value={form.adminSecret} onChange={handleChange} placeholder="SEU_SEGREDO" />
						</div>
						<div className="md:col-span-2 flex justify-end">
							<Button type="submit" disabled={loading} className="lco-btn-primary">
								{loading ? 'Cadastrando...' : 'Cadastrar Clínica'}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
};

export default ClinicRegisterAdmin; 