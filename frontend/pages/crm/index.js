"""
Page de gestion du CRM
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, InputNumber } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, ContactsOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;

const CRMPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);
  const [filters, setFilters] = useState({ statut: null, segment: null });
  const queryClient = useQueryClient();

  // Récupérer les prospects
  const { data: prospects = [], isLoading } = useQuery('prospects', async () => {
    const res = await axios.get('/api/crm/prospects');
    return res.data;
  });

  // Créer ou mettre à jour un prospect
  const mutation = useMutation(
    async (data) => {
      if (editingProspect) {
        return axios.put(`/api/crm/prospects/${editingProspect.id}`, data);
      }
      return axios.post('/api/crm/prospects', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('prospects');
        setIsModalVisible(false);
        setEditingProspect(null);
        form.resetFields();
        message.success(editingProspect ? 'Prospect mis à jour' : 'Prospect créé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer un prospect
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/crm/prospects/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('prospects');
        message.success('Prospect supprimé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (prospect = null) => {
    setEditingProspect(prospect);
    if (prospect) {
      form.setFieldsValue({
        nom: prospect.nom,
        prenom: prospect.prenom,
        raison_sociale: prospect.raison_sociale,
        telephone: prospect.telephone,
        email: prospect.email,
        segment: prospect.segment,
        statut: prospect.statut,
        potentiel: prospect.potentiel,
        observations: prospect.observations
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
    setEditingProspect(null);
    form.resetFields();
  };

  const statutColors = {
    nouveau: 'gray',
    contacte: 'blue',
    qualifie: 'green',
    proposition: 'purple',
    negotiation: 'orange',
    perdu: 'red',
    converti: 'gold'
  };

  const segments = ['agriculteur', 'cooperative', 'negociant', 'industriel', 'particulier', 'autre'];

  const filteredProspects = prospects.filter(p => {
    if (filters.statut && p.statut !== filters.statut) return false;
    if (filters.segment && p.segment !== filters.segment) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestion du CRM</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter un Prospect
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Prospects" value={prospects.length} prefix={<ContactsOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Nouveaux" 
                value={prospects.filter(p => p.statut === 'nouveau').length} 
                prefix={<Tag color="gray">N</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Qualifiés" 
                value={prospects.filter(p => p.statut === 'qualifie').length} 
                prefix={<Tag color="green">Q</Tag>}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Potentiel Total" 
                value={`€${prospects.reduce((sum, p) => sum + (p.potentiel || 0), 0).toFixed(2)}`} 
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
              <Option value="nouveau">Nouveau</Option>
              <Option value="contacte">Contacté</Option>
              <Option value="qualifie">Qualifié</Option>
              <Option value="proposition">Proposition</Option>
              <Option value="negociation">Négociation</Option>
              <Option value="perdu">Perdu</Option>
              <Option value="converti">Converti</Option>
            </Select>
            <Select 
              placeholder="Filtrer par segment" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, segment: val})}
              allowClear
            >
              {segments.map(s => (
                <Option key={s} value={s}>{s}</Option>
              ))}
            </Select>
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des prospects */}
        <Card>
          <Table 
            dataSource={filteredProspects} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Nom" dataIndex="nom" key="nom" />
            <Column title="Prénom" dataIndex="prenom" key="prenom" />
            <Column title="Raison Sociale" dataIndex="raison_sociale" key="raison_sociale" />
            <Column title="Email" dataIndex="email" key="email" />
            <Column title="Téléphone" dataIndex="telephone" key="telephone" />
            <Column title="Segment" dataIndex="segment" key="segment" />
            <Column title="Potentiel" dataIndex="potentiel" key="potentiel" render={(val) => `€${val || 0}`} />
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
                    title="Êtes-vous sûr de vouloir supprimer ce prospect ?"
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
          title={editingProspect ? 'Modifier Prospect' : 'Ajouter Prospect'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="nom" label="Nom" rules={[{ required: true, message: 'Veuillez entrer un nom' }]}>
                  <Input placeholder="Nom" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="prenom" label="Prénom">
                  <Input placeholder="Prénom" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="raison_sociale" label="Raison Sociale">
              <Input placeholder="Raison sociale" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="email" label="Email">
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
                <Form.Item name="segment" label="Segment">
                  <Select placeholder="Sélectionnez un segment">
                    {segments.map(s => (
                      <Option key={s} value={s}>{s}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="statut" label="Statut">
                  <Select placeholder="Sélectionnez un statut">
                    <Option value="nouveau">Nouveau</Option>
                    <Option value="contacte">Contacté</Option>
                    <Option value="qualifie">Qualifié</Option>
                    <Option value="proposition">Proposition</Option>
                    <Option value="negociation">Négociation</Option>
                    <Option value="perdu">Perdu</Option>
                    <Option value="converti">Converti</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="potentiel" label="Potentiel (€)">
              <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="observations" label="Observations">
              <TextArea rows={3} placeholder="Observations" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default CRMPage;
