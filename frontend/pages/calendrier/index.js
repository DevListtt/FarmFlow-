"""
Page de gestion du calendrier
"""
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { Card, Button, Input, Select, Modal, Table, Statistic, Row, Col, message, Form, Space, Tag, Popconfirm, DatePicker, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Layout from '../../components/Layout';

const { Option } = Select;
const { Column } = Table;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CalendrierPage = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingEvenement, setEditingEvenement] = useState(null);
  const [filters, setFilters] = useState({ type: null, statut: null });
  const queryClient = useQueryClient();

  // Récupérer les événements
  const { data: evenements = [], isLoading } = useQuery('evenements', async () => {
    const res = await axios.get('/api/calendrier/evenements');
    return res.data;
  });

  // Récupérer les types d'événements
  const { data: typesEvenement = [] } = useQuery('types_evenements', async () => {
    const res = await axios.get('/api/calendrier/types-evenements');
    return res.data;
  });

  // Créer ou mettre à jour un événement
  const mutation = useMutation(
    async (data) => {
      if (editingEvenement) {
        return axios.put(`/api/calendrier/evenements/${editingEvenement.id}`, data);
      }
      return axios.post('/api/calendrier/evenements', data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('evenements');
        setIsModalVisible(false);
        setEditingEvenement(null);
        form.resetFields();
        message.success(editingEvenement ? 'Événement mis à jour' : 'Événement créé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
      }
    }
  );

  // Supprimer un événement
  const deleteMutation = useMutation(
    async (id) => axios.delete(`/api/calendrier/evenements/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('evenements');
        message.success('Événement supprimé');
      },
      onError: (err) => {
        message.error(err.response?.data?.detail || 'Erreur lors de la suppression');
      }
    }
  );

  const showModal = (evenement = null) => {
    setEditingEvenement(evenement);
    if (evenement) {
      form.setFieldsValue({
        titre: evenement.titre,
        description: evenement.description,
        type_evenement_id: evenement.type_evenement_id,
        date_debut: evenement.date_debut,
        date_fin: evenement.date_fin,
        lieu: evenement.lieu,
        priorite: evenement.priorite,
        statut: evenement.statut,
        organisateur: evenement.organisateur,
        participants: evenement.participants
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
    setEditingEvenement(null);
    form.resetFields();
  };

  const prioriteColors = {
    faible: 'gray',
    moyenne: 'blue',
    haute: 'orange',
    urgente: 'red'
  };

  const statutColors = {
    planifie: 'gray',
    en_cours: 'blue',
    termine: 'green',
    annule: 'red'
  };

  const filteredEvenements = evenements.filter(e => {
    if (filters.type && e.type_evenement_id !== filters.type) return false;
    if (filters.statut && e.statut !== filters.statut) return false;
    return true;
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Calendrier</h1>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Ajouter un Événement
          </Button>
        </div>

        {/* Statistiques */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic title="Total Événements" value={evenements.length} prefix={<CalendarOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="À Venir" 
                value={evenements.filter(e => e.statut === 'planifie').length} 
                prefix={<Badge status="default" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="En Cours" 
                value={evenements.filter(e => e.statut === 'en_cours').length} 
                prefix={<Badge status="processing" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="Terminés" 
                value={evenements.filter(e => e.statut === 'termine').length} 
                prefix={<Badge status="success" />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filtres */}
        <Card className="mb-6">
          <div className="flex gap-4">
            <Select 
              placeholder="Filtrer par type" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, type: val})}
              allowClear
            >
              {typesEvenement.map(t => (
                <Option key={t.id} value={t.id}>{t.nom}</Option>
              ))}
            </Select>
            <Select 
              placeholder="Filtrer par statut" 
              style={{ width: 200 }} 
              onChange={(val) => setFilters({...filters, statut: val})}
              allowClear
            >
              <Option value="planifie">Planifié</Option>
              <Option value="en_cours">En Cours</Option>
              <Option value="termine">Terminé</Option>
              <Option value="annule">Annulé</Option>
            </Select>
            <RangePicker placeholder={['Date de début', 'Date de fin']} />
            <Button icon={<SearchOutlined />} type="primary">
              Rechercher
            </Button>
          </div>
        </Card>

        {/* Tableau des événements */}
        <Card>
          <Table 
            dataSource={filteredEvenements} 
            loading={isLoading}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          >
            <Column title="Titre" dataIndex="titre" key="titre" />
            <Column title="Type" dataIndex="type_evenement_nom" key="type_evenement_nom" />
            <Column title="Date Début" dataIndex="date_debut" key="date_debut" />
            <Column title="Date Fin" dataIndex="date_fin" key="date_fin" />
            <Column title="Lieu" dataIndex="lieu" key="lieu" />
            <Column title="Organisateur" dataIndex="organisateur" key="organisateur" />
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
                    title="Êtes-vous sûr de vouloir supprimer cet événement ?"
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
          title={editingEvenement ? 'Modifier Événement' : 'Ajouter Événement'} 
          open={isModalVisible} 
          onOk={handleOk} 
          onCancel={handleCancel}
          confirmLoading={mutation.isLoading}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item name="titre" label="Titre" rules={[{ required: true, message: 'Veuillez entrer un titre' }]}>
              <Input placeholder="Titre de l'événement" />
            </Form.Item>
            <Form.Item name="type_evenement_id" label="Type d'Événement">
              <Select placeholder="Sélectionnez un type">
                {typesEvenement.map(t => (
                  <Option key={t.id} value={t.id}>{t.nom}</Option>
                ))}
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="date_debut" label="Date de Début" rules={[{ required: true, message: 'Veuillez sélectionner une date' }]}>
                  <DatePicker style={{ width: '100%' }} showTime />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="date_fin" label="Date de Fin">
                  <DatePicker style={{ width: '100%' }} showTime />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="lieu" label="Lieu">
              <Input placeholder="Lieu de l'événement" />
            </Form.Item>
            <Form.Item name="organisateur" label="Organisateur">
              <Input placeholder="Organisateur" />
            </Form.Item>
            <Form.Item name="participants" label="Participants">
              <TextArea rows={2} placeholder="Liste des participants" />
            </Form.Item>
            <Row gutter={16}>
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
              <Col span={12}>
                <Form.Item name="statut" label="Statut">
                  <Select placeholder="Sélectionnez un statut">
                    <Option value="planifie">Planifié</Option>
                    <Option value="en_cours">En Cours</Option>
                    <Option value="termine">Terminé</Option>
                    <Option value="annule">Annulé</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="description" label="Description">
              <TextArea rows={3} placeholder="Description de l'événement" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Layout>
  );
};

export default CalendrierPage;
