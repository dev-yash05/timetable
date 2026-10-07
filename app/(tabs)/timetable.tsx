// app/(tabs)/timetable.tsx
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, ActivityIndicator,
} from 'react-native';
import * as Calendar from 'expo-calendar/legacy';
import { Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTimetableStore, TimetableSlot } from '../../store/useTimetableStore';
import { useAuthStore } from '../../store/useAuthStore';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const COLORS = ['#FF5733', '#33B5FF', '#33FF57', '#F333FF', '#FFB533'];

export default function TimetableScreen() {
  const { user } = useAuthStore();
  const { slots, viewMode, setViewMode, subscribeToSlots, addSlot, deleteSlot, isLoading } = useTimetableStore();

  // Modal State
  const [isModalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [selectedDay, setSelectedDay] = useState(1); // 1 = Mon
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = subscribeToSlots(user.uid);
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddSlot = async () => {
    if (!newTitle || !newStartTime || !newEndTime || !user) {
      Alert.alert("Missing Fields", "Please fill out the title, start time, and end time.");
      return;
    }

    const newSlot: TimetableSlot = {
      id: Date.now().toString(), 
      userId: user.uid,
      title: newTitle,
      startTime: newStartTime, // Expects standard format like "09:00"
      endTime: newEndTime,     // Expects standard format like "10:30"
      dayOfWeek: selectedDay,
      colorTag: selectedColor,
    };

    await addSlot(newSlot);
    setModalVisible(false);
    setNewTitle('');
    setNewStartTime('');
    setNewEndTime('');
  };

  const currentDayIndex = new Date().getDay() === 0 ? 7 : new Date().getDay(); 

  const displayedSlots = viewMode === 'day'
    ? slots.filter(s => s.dayOfWeek === currentDayIndex)
    : slots;

  // Perfect Chronological Sorting based on startTime
  const sortedSlots = displayedSlots.sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    // Because format is strict "HH:MM", localeCompare works flawlessly
    return a.startTime.localeCompare(b.startTime);
  });

  const syncDeviceCalendar = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "We need access to sync your calendar.");
        return;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const activeCalendars = calendars.filter(c => c.allowsModifications || Platform.OS === 'ios');
      const calendarIds = activeCalendars.map(c => c.id);

      if (calendarIds.length === 0) return;

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      const events = await Calendar.getEventsAsync(calendarIds, startDate, endDate);
      let addedCount = 0;

      for (const event of events) {
        if (event.allDay) continue;

        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        
        // Formats strictly to "09:30" (24h format for perfect sorting)
        const formatTime = (date: Date) => 
          `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        const newSlot: TimetableSlot = {
          id: `calendar-${event.id}`,
          userId: user?.uid || '',
          title: event.title || 'Busy',
          startTime: formatTime(start),
          endTime: formatTime(end),
          dayOfWeek: start.getDay() === 0 ? 7 : start.getDay(),
          colorTag: COLORS[Math.floor(Math.random() * COLORS.length)],
        };

        try {
          await addSlot(newSlot);
          addedCount++;
        } catch (err) {
          console.error("Failed to add synced slot:", err);
        }
      }

      Alert.alert("Sync Complete!", `Successfully imported ${addedCount} events to your timetable.`);
    } catch (error) {
      console.error("Calendar Sync Error:", error);
      Alert.alert("Error", "Could not sync calendar.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'day' && styles.activeToggle]} onPress={() => setViewMode('day')}>
            <Text style={[styles.toggleText, viewMode === 'day' && styles.activeToggleText]}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, viewMode === 'week' && styles.activeToggle]} onPress={() => setViewMode('week')}>
            <Text style={[styles.toggleText, viewMode === 'week' && styles.activeToggleText]}>Week</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity onPress={syncDeviceCalendar} style={{ padding: 10, backgroundColor: '#007AFF', borderRadius: 8, margin: 15, alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sync Device Calendar 📅</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator size="large" color="#FF5733" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {sortedSlots.length === 0 ? (
            <Text style={styles.emptyText}>No classes or events scheduled.</Text>
          ) : (
            sortedSlots.map((slot) => (
              <View key={slot.id} style={[styles.slotCard, { borderLeftColor: slot.colorTag }]}>
                <View style={styles.slotInfo}>
                  <Text style={styles.slotTitle}>{slot.title}</Text>
                  {/* Combines startTime and endTime perfectly on the fly for display */}
                  <Text style={styles.slotTime}>
                    {DAYS[slot.dayOfWeek - 1]} • {slot.startTime} - {slot.endTime}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteSlot(slot.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Time Block</Text>

            <TextInput style={styles.input} placeholder="Title (e.g. CS101 Lecture)" value={newTitle} onChangeText={setNewTitle} />
            <View style={{flexDirection: 'row', gap: 10}}>
               <TextInput style={[styles.input, {flex: 1}]} placeholder="Start (e.g. 09:00)" value={newStartTime} onChangeText={setNewStartTime} />
               <TextInput style={[styles.input, {flex: 1}]} placeholder="End (e.g. 10:30)" value={newEndTime} onChangeText={setNewEndTime} />
            </View>

            <Text style={styles.label}>Day of Week</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, index) => (
                <TouchableOpacity key={day} style={[styles.dayChip, selectedDay === index + 1 && styles.activeDayChip]} onPress={() => setSelectedDay(index + 1)}>
                  <Text style={[styles.dayText, selectedDay === index + 1 && styles.activeDayText]}>{day}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Color Tag</Text>
            <View style={styles.colorRow}>
              {COLORS.map((color) => (
                <TouchableOpacity key={color} style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && styles.activeColor]} onPress={() => setSelectedColor(color)} />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddSlot}>
                <Text style={styles.saveText}>Save</Text>
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
  slotCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  slotInfo: { flex: 1 },
  slotTitle: { fontSize: 16, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 4 },
  slotTime: { fontSize: 14, color: '#8E8E93' },
  deleteBtn: { padding: 8 },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#FF5733', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: '#FF5733', shadowOpacity: 0.4, shadowRadius: 5, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, ...Platform.select({ web: { alignSelf: 'center', width: 500, borderRadius: 20, margin: 20 } }) },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: '#F2F2F7', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#8E8E93', marginBottom: 10, marginTop: 5 },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  dayChip: { paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F2F2F7', borderRadius: 20 },
  activeDayChip: { backgroundColor: '#FF5733' },
  dayText: { color: '#8E8E93', fontWeight: '500' },
  activeDayText: { color: '#fff' },
  colorRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  colorCircle: { width: 40, height: 40, borderRadius: 20 },
  activeColor: { borderWidth: 3, borderColor: '#000' },
  modalActions: { flexDirection: 'row', gap: 15 },
  cancelBtn: { flex: 1, padding: 15, backgroundColor: '#F2F2F7', borderRadius: 10, alignItems: 'center' },
  cancelText: { color: '#FF3B30', fontWeight: 'bold', fontSize: 16 },
  saveBtn: { flex: 1, padding: 15, backgroundColor: '#FF5733', borderRadius: 10, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});