// app/(tabs)/tasks.tsx
import { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Modal, TextInput, ActivityIndicator, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore, Task } from '../../store/useTaskStore';
import { useAuthStore } from '../../store/useAuthStore';

type FilterType = 'all' | 'pending' | 'completed';
const PRIORITIES: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];

export default function TasksScreen() {
  const { user } = useAuthStore();
  const { tasks, isLoading, subscribeToTasks, addTask, toggleTask, deleteTask } = useTaskStore();
  
  const [filter, setFilter] = useState<FilterType>('pending');
  
  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  // Connect to Firestore on Mount
  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToTasks(user.uid);
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !user) return;
    
    const newTask: Task = {
      id: Date.now().toString(),
      userId: user.uid,
      title: newTaskTitle.trim(),
      priority: newPriority,
      isCompleted: false,
      createdAt: Date.now(),
    };

    await addTask(newTask);
    setModalVisible(false);
    setNewTaskTitle('');
    setNewPriority('medium');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.isCompleted;
    if (filter === 'completed') return t.isCompleted;
    return true; // 'all'
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header & Filter Toggles */}
      <View style={styles.header}>
        <View style={styles.toggleContainer}>
          {(['pending', 'completed', 'all'] as FilterType[]).map((f) => (
            <TouchableOpacity 
              key={f}
              style={[styles.toggleBtn, filter === f && styles.activeToggle]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.toggleText, filter === f && styles.activeToggleText]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#FF5733" style={{ marginTop: 50 }} />
      ) : (
        /* Tasks List */
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {filteredTasks.length === 0 ? (
            <Text style={styles.emptyText}>No tasks found in this view.</Text>
          ) : (
            filteredTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                
                {/* Custom Checkbox */}
                <TouchableOpacity onPress={() => toggleTask(task.id, task.isCompleted)} style={styles.checkbox}>
                  <Ionicons 
                    name={task.isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                    size={28} 
                    color={task.isCompleted ? "#34C759" : "#C7C7CC"} 
                  />
                </TouchableOpacity>

                {/* Task Details */}
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, task.isCompleted && styles.completedText]}>
                    {task.title}
                  </Text>
                  <View style={styles.priorityBadge}>
                    <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                    <Text style={styles.priorityText}>{task.priority} priority</Text>
                  </View>
                </View>

                {/* Delete Button */}
                <TouchableOpacity onPress={() => deleteTask(task.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Task</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="What needs to be done?" 
              value={newTaskTitle} 
              onChangeText={setNewTaskTitle} 
              autoFocus
            />
            
            <Text style={styles.label}>Priority Level</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity 
                  key={p} 
                  style={[styles.priorityChip, newPriority === p && { backgroundColor: getPriorityColor(p) }]}
                  onPress={() => setNewPriority(p)}
                >
                  <Text style={[styles.priorityChipText, newPriority === p && styles.activePriorityText]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddTask}>
                <Text style={styles.saveText}>Save Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E5EA' },
  toggleContainer: { flexDirection: 'row', backgroundColor: '#E5E5EA', borderRadius: 8, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeToggle: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '500', color: '#8E8E93' },
  activeToggleText: { color: '#000' },
  scrollContent: { padding: 15, paddingBottom: 100 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#8E8E93', fontSize: 16 },
  
  taskCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  checkbox: { marginRight: 15 },
  taskInfo: { flex: 1, justifyContent: 'center' },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E', marginBottom: 4 },
  completedText: { textDecorationLine: 'line-through', color: '#8E8E93' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center' },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  priorityText: { fontSize: 12, color: '#8E8E93', textTransform: 'capitalize' },
  deleteBtn: { padding: 8, marginLeft: 10 },
  
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#FF5733', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF5733', shadowOpacity: 0.4, shadowRadius: 5, elevation: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, ...Platform.select({ web: { alignSelf: 'center', width: 500, borderRadius: 20, margin: 20 } }) },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 10, marginBottom: 20, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 10 },
  
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  priorityChip: { flex: 1, paddingVertical: 10, backgroundColor: '#F2F2F7', borderRadius: 8, alignItems: 'center' },
  priorityChipText: { color: '#8E8E93', fontWeight: '600' },
  activePriorityText: { color: '#fff' },
  
  modalActions: { flexDirection: 'row', gap: 15 },
  cancelBtn: { flex: 1, padding: 15, backgroundColor: '#F2F2F7', borderRadius: 10, alignItems: 'center' },
  cancelText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  saveBtn: { flex: 1, padding: 15, backgroundColor: '#FF5733', borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});