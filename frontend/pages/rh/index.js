"""
Page de gestion des Ressources Humaines
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;

const RHPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState(null);
  const [filters, setFilters] = useState({ statut: null, poste: null });
  const queryClient = useQueryClient();

  // Récupérer les employés
  const { data: employes = [], isLoading } = useQuery('employes', async () => {
    const res = await axios.get('/api/rh/employes');
    return res.data;
  });

  // Récupérer les postes
  const { data: postes = [] } = useQuery('postes', async () => {
    const res = await axios.get('/api/rh/postes');
    return res.data;
  });

  // Créer ou mettre à jour un employé
  const mutation = useMutation(
    async (data) => {
      if (editingEmploye) {
        return axios.put(`/api/rh/employes/${editingEmploye.id}`, data);
      }
      return axios.post('/api/rh/employes', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employes');
        setIsModalVisible(false);
        setEditingEmploye(null);
        form.resetFields();
        message.success(editingEmploye ? 'Employé mis à jour' : 'Employé créé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer un employé
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/rh/employes/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('employes');
        message.success('Employé supprimé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (employe = null) => {
    setEditingEmploye(employe);
    if (employe) {
      form.setFieldsValue({
        matricule: employe.matricule,
        nom: employe.nom,
        prenom: employe.prenom,
        poste_id: employe.poste_id,
        email: employe.email,
        telephone: employe.telephone,
        statut: employe.statut,
        date_embauche: employe.date_embauche,
        salaire_brut: employe.salaire_brut
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      mutation.mutate(values);
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingEmploye(null);
    form.resetFields();
  };

  const statutColors = {
    actif: 'green',
    en_conge: 'blue',
    malade: 'orange',
    en_formation: 'purple',
    licencie: 'red',
    retraite: 'gray'
  };

  const filteredEmployes = employes.filter(e => {
    if (filters.statut && e.statut !== filters.statut) return false;
    if (filters.poste && e.poste_id !== filters.poste) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Ressources Humaines</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter un Employé
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Employés" value={employes.length} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Actifs" 
                value={employes.filter(e => e.statut === 'actif').length} 
                prefix={<Tag color="green">A</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="En Congé" 
                value={employes.filter(e => e.statut === 'en_conge').length} 
                prefix={<Tag color="blue">C</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Masse Salariale" 
                value={`€${employes.reduce((sum, e) => sum + (e.salaire_brut || 0), 0).toFixed(2)}/mois`} 
              />
            </Card>
          </Col>
        </Row>

        {/* Filtres */}
        <Card className="mb-6">
          <div className="flex gap-4">
            <Select 
              placeholder="Filtrer par statut" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, statut: val})}
              allowClear
            >
              <Option value="actif">Actif</Option>
              <Option value="en_conge">En Congé</Option>
              <Option value="malade">Malade</Option>
              <Option value="en_formation">En Formation</Option>
              <Option value="licencie">Licencié</Option>
              <Option value="retraite">Retraité</Option>
            </Select>
            <Select 
              placeholder="Filtrer par poste" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, poste: val})}
              allowClear
            >
              {postes.map(p => (
                <Option key={p.id} value={p.id}>{p.nom}</Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des employés */}
        <Card>
          <Table 
            dataSource={filteredEmployes} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Matricule" dataIndex="matricule" key="matricule" />
            <Column title="Nom" dataIndex="nom" key="nom" />
            <Column title="Prénom" dataIndex="prenom" key="prenom" />
            <Column title="Poste" dataIndex="poste_nom" key="poste_nom" />
            <Column title="Email" dataIndex="email" key="email" />
            <Column title="Téléphone" dataIndex="telephone" key="telephone" />
            <Column title="Salaire Brut" dataIndex="salaire_brut" key="salaire_brut" render={(val) => `€${val || 0}`} />
            <Column 
              title="Statut" 
              dataIndex="statut" 
              key="statut" 
              render={(statut) => (
                <Tag color={statutColors[statut] || 'default'}>
                  {statut}
                </Tag>
              )}
            />
            <Column 
              title="Actions" 
              key="actions" 
              render={(_, record) => (
                <Space>
                  <Button icon={<EyeOutlined />} onClick={() => showModal(record)} size="small" />
                  <Button icon={<EditOutlined />} onClick={() => showModal(record)} size="small" type="link" />
                  <Popconfirm
                    title="Êtes-vous sûr de vouloir supprimer cet employé ?"
                    onConfirm={() => deleteMutation.mutate(record.id)}
                    okText="Oui"
                    cancelText="Non"
                  >
                    <Button icon={<DeleteOutlined />} size="small" danger type="link" />
                  </Popconfirm>
                </Space>
              )}
            />
          </Table>
        </Card>

        {/* Modal */}
        <Modal 
          title={editingEmploye ? 'Modifier Employé' : 'Ajouter Employé'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="matricule" label="Matricule" rules={[{ required: true, message: 'Veuillez entrer un matricule' }]}>
                  <Input placeholder="Numéro de matricule" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="poste_id" label="Poste">
                  <Select placeholder="Sélectionnez un poste">
                    {postes.map(p => (
                      <Option key={p.id} value={p.id}>{p.nom}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Veuillez entrer un nom' }]}>
                  <Input placeholder="Nom" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="prenom" label="Prénom" rules={[{ required: true, message: 'Veuillez entrer un prénom' }]}>
                  <Input placeholder="Prénom" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Veuillez entrer un email' }]}>
                  <Input placeholder="Email" type="email" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="telephone" label="Téléphone">
                  <Input placeholder="Téléphone" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="date_embauche" label="Date d'Embauche">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="salaire_brut" label="Salaire Brut (€)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="statut" label="Statut">
              <Select placeholder="Sélectionnez un statut">
                <Option value="actif">Actif</Option>
                <Option value="en_conge">En Congé</Option>
                <Option value="malade">Malade</Option>
                <Option value="en_formation">En Formation</Option>
                <Option value="licencie">Licencié</Option>
                <Option value="retraite">Retraité</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default RHPage;
