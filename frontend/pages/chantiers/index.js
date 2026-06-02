"""
Page de gestion des chantiers
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, InputNumber, DatePicker } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ProjectOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;

const ChantiersPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingChantier, setEditingChantier] = useState(null);
  const [filters, setFilters] = useState({ statut: null });
  const queryClient = useQueryClient();

  // Récupérer les chantiers
  const { data: chantiers = [], isLoading } = useQuery('chantiers', async () => {
    const res = await axios.get('/api/chantiers');
    return res.data;
  });

  // Créer ou mettre à jour un chantier
  const mutation = useMutation(
    async (data) => {
      if (editingChantier) {
        return axios.put(`/api/chantiers/${editingChantier.id}`, data);
      }
      return axios.post('/api/chantiers', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('chantiers');
        setIsModalVisible(false);
        setEditingChantier(null);
        form.resetFields();
        message.success(editingChantier ? 'Chantier mis à jour' : 'Chantier créé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer un chantier
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/chantiers/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('chantiers');
        message.success('Chantier supprimé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (chantier = null) => {
    setEditingChantier(chantier);
    if (chantier) {
      form.setFieldsValue({
        nom: chantier.nom,
        code: chantier.code,
        description: chantier.description,
        statut: chantier.statut,
        priorite: chantier.priorite,
        budget: chantier.budget,
        responsable: chantier.responsable,
        localisation: chantier.localisation
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
    setEditingChantier(null);
    form.resetFields();
  };

  const statutColors = {
    planifie: 'gray',
    en_cours: 'blue',
    termine: 'green',
    suspendu: 'orange',
    annule: 'red'
  };

  const prioriteColors = {
    faible: 'gray',
    moyenne: 'blue',
    haute: 'orange',
    urgente: 'red'
  };

  const filteredChantiers = chantiers.filter(c => {
    if (filters.statut && c.statut !== filters.statut) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Chantiers</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter un Chantier
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Chantiers" value={chantiers.length} prefix={<ProjectOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="En Cours" 
                value={chantiers.filter(c => c.statut === 'en_cours').length} 
                prefix={<Tag color="blue">C</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Terminés" 
                value={chantiers.filter(c => c.statut === 'termine').length} 
                prefix={<Tag color="green">T</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Budget Total" 
                value={`€${chantiers.reduce((sum, c) => sum + (c.budget || 0), 0).toFixed(2)}`} 
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
              <Option value="planifie">Planifié</Option>
              <Option value="en_cours">En Cours</Option>
              <Option value="termine">Terminé</Option>
              <Option value="suspendu">Suspendu</Option>
              <Option value="annule">Annulé</Option>
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des chantiers */}
        <Card>
          <Table 
            dataSource={filteredChantiers} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Code" dataIndex="code" key="code" />
            <Column title="Nom" dataIndex="nom" key="nom" />
            <Column title="Responsable" dataIndex="responsable" key="responsable" />
            <Column title="Budget" dataIndex="budget" key="budget" render={(val) => `€${val || 0}`} />
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
              title="Priorité" 
              dataIndex="priorite" 
              key="priorite" 
              render={(priorite) => (
                <Tag color={prioriteColors[priorite] || 'default'}>
                  {priorite}
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
                    title="Êtes-vous sûr de vouloir supprimer ce chantier ?"
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
          title={editingChantier ? 'Modifier Chantier' : 'Ajouter Chantier'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Veuillez entrer un nom' }]}>
              <Input placeholder="Nom du chantier" />
            </Form.Item>
            <Form.Item name="code" label="Code" rules={[{ required: true, message: 'Veuillez entrer un code' }]}>
              <Input placeholder="Code interne" />
            </Form.Item>
            <Form.Item name="description" label="Description">
              <TextArea rows={3} placeholder="Description du chantier" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="statut" label="Statut">
                  <Select placeholder="Sélectionnez un statut">
                    <Option value="planifie">Planifié</Option>
                    <Option value="en_cours">En Cours</Option>
                    <Option value="termine">Terminé</Option>
                    <Option value="suspendu">Suspendu</Option>
                    <Option value="annule">Annulé</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="priorite" label="Priorité">
                  <Select placeholder="Sélectionnez une priorité">
                    <Option value="faible">Faible</Option>
                    <Option value="moyenne">Moyenne</Option>
                    <Option value="haute">Haute</Option>
                    <Option value="urgente">Urgente</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="budget" label="Budget (€)">
                  <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="responsable" label="Responsable">
                  <Input placeholder="Responsable du chantier" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="localisation" label="Localisation">
              <Input placeholder="Localisation du chantier" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default ChantiersPage;
