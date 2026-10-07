// app/(tabs)/analytics.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';

export default function AnalyticsScreen() {
  const { tasks } = useTaskStore();

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const pendingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const highPriorityCompleted = tasks.filter(t => t.priority === 'high' && t.isCompleted).length;
  const highPriorityTotal = tasks.filter(t => t.priority === 'high').length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Productivity</Text>
        <Text style={styles.headerSubtitle}>Your weekly performance</Text>
      </View>

      {/* Main Stat Ring */}
      <View style={styles.mainStatCard}>
        <View style={styles.circleContainer}>
          <Text style={styles.percentageText}>{completionRate}%</Text>
          <Text style={styles.percentageSub}>Completion</Text>
        </View>
        <View style={styles.statDetails}>
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.statLabel}>{completedTasks} Completed</Text>
          </View>
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: '#FF3B30' }]} />
            <Text style={styles.statLabel}>{pendingTasks} Pending</Text>
          </View>
        </View>
      </View>

      {/* Mini Cards */}
      <View style={styles.grid}>
        <View style={styles.miniCard}>
          <Ionicons name="flame" size={32} color="#FF9500" />
          <Text style={styles.miniCardValue}>{highPriorityCompleted}/{highPriorityTotal}</Text>
          <Text style={styles.miniCardLabel}>High Priority Done</Text>
        </View>
        <View style={styles.miniCard}>
          <Ionicons name="trophy" size={32} color="#FFCC00" />
          <Text style={styles.miniCardValue}>{totalTasks}</Text>
          <Text style={styles.miniCardLabel}>Total Tasks</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#E5E5EA' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E' },
  headerSubtitle: { fontSize: 16, color: '#8E8E93', marginTop: 4 },
  
  mainStatCard: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  circleContainer: { width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: '#34C759', justifyContent: 'center', alignItems: 'center' },
  percentageText: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E' },
  percentageSub: { fontSize: 12, color: '#8E8E93' },
  
  statDetails: { marginLeft: 30, flex: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  statLabel: { fontSize: 16, color: '#1C1C1E', fontWeight: '500' },

  grid: { flexDirection: 'row', paddingHorizontal: 20, gap: 15 },
  miniCard: { flex: 1, backgroundColor: '#fff', padding: 20, borderRadius: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  miniCardValue: { fontSize: 24, fontWeight: 'bold', color: '#1C1C1E', marginTop: 10 },
  miniCardLabel: { fontSize: 14, color: '#8E8E93', marginTop: 5, textAlign: 'center' }
});