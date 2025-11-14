import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

import {MOCK_POSTS} from '../data/mockPlants';
import DateTimePicker, {
  DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';

const CONFIDENCE_OPTIONS = [0, 60, 80];
const SORT_OPTIONS = [
  {key: 'newest', label: 'Newest'},
  {key: 'oldest', label: 'Oldest'},
  {key: 'az', label: 'A to Z'},
];
const SPECIES_SLUGS = [
  'acacia_auriculiformis',
  'acacia_mangium',
  'alocasia_longiloba',
  'alocasia_macrorrhizos',
  'casuarina_equisetifolia',
  'cerbera_manghas',
  'crotalaria_pallida',
  'morinda_citrifolia',
  'neolamarckia_cadamba',
  'oldenlandia_corymbosa',
  'peperomia_pellucida',
  'phyllanthus_amarus',
];
const SPECIES_OPTIONS = [
  {key: 'all', label: 'All species'},
  ...SPECIES_SLUGS.map(key => ({
    key,
    label: key
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' '),
  })),
];

function slugifySpeciesName(value = '') {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function startOfDay(date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function formatDate(iso) {
  if (!iso) return 'Unknown';
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function formatDateOnly(date) {
  if (!date) return '';
  try {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function SearchScreen() {
  const nav = useNavigation();

  const [query, setQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [minConfidence, setMinConfidence] = useState(0);
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [speciesMenuVisible, setSpeciesMenuVisible] = useState(false);
  const [dateRange, setDateRange] = useState({start: null, end: null});
  const [activeDateField, setActiveDateField] = useState(null);
  const [iosPickerVisible, setIosPickerVisible] = useState(false);
  const [iosTempDate, setIosTempDate] = useState(new Date());
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const startBoundary = dateRange.start ? startOfDay(dateRange.start) : null;
    const endBoundary = dateRange.end ? endOfDay(dateRange.end) : null;
    let list = MOCK_POSTS.slice();

    if (term) {
      list = list.filter(item => {
        const haystack = [
          item.speciesName,
          item.commonName,
          item.scientificName,
          item.locationName,
          item.uploadedBy,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(term);
      });
    }

    if (rarityFilter === 'endangered') {
      list = list.filter(item => item.isEndangered);
    } else if (rarityFilter === 'not_endangered') {
      list = list.filter(item => item.isEndangered === false);
    }

    if (speciesFilter !== 'all') {
      list = list.filter(item => {
        const speciesSlug = slugifySpeciesName(item.speciesName || '');
        const scientificSlug = slugifySpeciesName(item.scientificName || '');
        return (
          speciesSlug === speciesFilter || scientificSlug === speciesFilter
        );
      });
    }

    if (sourceFilter !== 'all') {
      list = list.filter(item => item.source === sourceFilter);
    }

    if (minConfidence > 0) {
      list = list.filter(item => (item.confidence || 0) >= minConfidence);
    }

    if (startBoundary || endBoundary) {
      list = list.filter(item => {
        const created = new Date(item.createdAt);
        if (Number.isNaN(created.getTime())) return false;
        if (startBoundary && created < startBoundary) return false;
        if (endBoundary && created > endBoundary) return false;
        return true;
      });
    }

    switch (sort) {
      case 'oldest':
        return list.sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
        );
      case 'az':
        return list.sort((a, b) =>
          (a.speciesName || '').localeCompare(b.speciesName || ''),
        );
      default:
        return list.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );
    }
  }, [
    query,
    rarityFilter,
    speciesFilter,
    sourceFilter,
    minConfidence,
    sort,
    dateRange.start,
    dateRange.end,
  ]);

  const resultWord = results.length === 1 ? 'result' : 'results';
  const hasActiveSort = sort !== 'newest';
  const hasSearch = Boolean(query.trim());
  const hasFilter =
    rarityFilter !== 'all' ||
    speciesFilter !== 'all' ||
    sourceFilter !== 'all' ||
    minConfidence > 0 ||
    Boolean(dateRange.start) ||
    Boolean(dateRange.end);
  const showForYou = !hasActiveSort && !hasSearch && !hasFilter;

  const toggleRarity = nextValue => {
    setRarityFilter(prev => (prev === nextValue ? 'all' : nextValue));
  };

  const clearDateRange = () => {
    setDateRange({start: null, end: null});
    setActiveDateField(null);
  };

  const handleDateSelection = (field, selectedDate) => {
    if (!field || !selectedDate) return;
    const safeDate = new Date(selectedDate);
    setDateRange(prev => {
      const next = {...prev, [field]: safeDate};
      if (field === 'start' && next.end && safeDate > next.end) {
        next.end = null;
      }
      if (field === 'end' && next.start && safeDate < next.start) {
        next.start = null;
      }
      return next;
    });
  };

  const openDatePicker = field => {
    if (!field) {
      return;
    }
    setSortMenuVisible(false);
    setSpeciesMenuVisible(false);

    const currentValue = dateRange[field]
      ? new Date(dateRange[field])
      : new Date();

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        mode: 'date',
        value: currentValue,
        onChange: (event, selectedDate) => {
          if (event?.type !== 'set' || !selectedDate) {
            return;
          }
          handleDateSelection(field, selectedDate);
        },
      });
    } else {
      setActiveDateField(field);
      setIosTempDate(currentValue);
      setIosPickerVisible(true);
    }
  };

  const handleIosDone = () => {
    if (activeDateField) {
      handleDateSelection(activeDateField, iosTempDate);
    }
    setIosPickerVisible(false);
    setActiveDateField(null);
  };

  const handleIosCancel = () => {
    setIosPickerVisible(false);
    setActiveDateField(null);
  };

  const iosModalTitle =
    activeDateField === 'end' ? 'Select end date' : 'Select start date';

  const renderItem = ({item}) => {
    const imgSource =
      typeof item.photoUri === 'string' ? {uri: item.photoUri} : item.photoUri;

    const openObservation = () =>
      nav.navigate('ObservationDetail', {
        id: item.id,
        speciesName: item.speciesName,
        scientificName: item.scientificName,
        commonName: item.commonName,
        isEndangered: item.isEndangered,
        photoUri: item.photoUri,
        createdAt: item.createdAt,
        confidence: item.confidence,
        region: item.region,
        locationName: item.locationName,
        latitude: item.latitude,
        longitude: item.longitude,
        notes: item.notes,
        uploadedBy: item.uploadedBy,
        source: item.source,
      });

    const userInitials = (item.uploadedBy || '?').slice(0, 2).toUpperCase();

    return (
      <View style={s.post}>
        <View style={s.postHeader}>
          <View style={s.userInfo}>
            <View style={s.userBadge}>
              <Text style={s.userBadgeText}>{userInitials}</Text>
            </View>
            <Text style={s.username}>{item.uploadedBy || 'Unknown user'}</Text>
          </View>
          <Pressable
            style={s.viewButton}
            onPress={openObservation}
            android_ripple={{color: '#00000010', borderless: false}}>
            <Text style={s.viewButtonText}>View</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={openObservation}
          style={s.imageWrap}
          android_ripple={{color: '#00000018'}}>
          <Image source={imgSource} style={s.postImage} resizeMode="cover" />
        </Pressable>

        <View style={s.postBody}>
          <Text style={s.postTitle}>
            {item.speciesName || item.commonName || 'Unknown species'}
          </Text>
          <Text style={s.postMeta}>
            {item.isEndangered
              ? 'Location hidden to protect species'
              : item.locationName || 'Unknown location'}
          </Text>
          <Text style={s.postTimestamp}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right']}>
      <Modal
        visible={Platform.OS === 'ios' && iosPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={handleIosCancel}>
        <View style={s.iosModalOverlay}>
          <View style={s.iosModalContent}>
            <View style={s.iosModalHeader}>
              <Text style={s.iosModalTitle}>{iosModalTitle}</Text>
              <Pressable onPress={handleIosCancel} style={s.iosModalClose}>
                <Text style={s.iosModalCloseText}>✕</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={iosTempDate}
              mode="date"
              display="inline"
              onChange={(_, selectedDate) => {
                if (selectedDate) {
                  setIosTempDate(selectedDate);
                }
              }}
              style={s.iosDatePicker}
            />
            <View style={s.iosModalActions}>
              <Pressable
                onPress={handleIosDone}
                style={[s.modalButton, s.modalButtonPrimary]}
                android_ripple={{color: '#00000010'}}>
                <Text style={s.modalButtonPrimaryText}>Done</Text>
              </Pressable>
              <Pressable
                onPress={handleIosCancel}
                style={s.modalButton}
                android_ripple={{color: '#00000010'}}>
                <Text style={s.modalButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.listContent}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.title}>Search Plants</Text>
            <Text style={s.subtitle}>
              Discover plants shared by the community. Search by name, sort, or
              filter to find what you need.
            </Text>

            <View style={s.searchBox}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by species, common name, or user"
                placeholderTextColor="#94A3B8"
                style={s.input}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <View style={s.filterGroup}>
              <View style={s.filterGroupHeader}>
                <Text style={s.filterLabel}>Filters</Text>
                <Pressable
                  style={s.filterToggleButton}
                  onPress={() => setFiltersExpanded(prev => !prev)}
                  android_ripple={{color: '#00000014', borderless: true}}
                  hitSlop={8}>
                  <Text
                    style={[
                      s.filterToggleText,
                      !filtersExpanded && s.caretFlipped,
                    ]}>
                    ^
                  </Text>
                </Pressable>
              </View>

              {filtersExpanded ? (
                <>
                  <View style={s.filterBlock}>
                    <Text style={s.filterSubLabel}>Rarity</Text>
                    <View style={s.filterRow}>
                      <FilterChip
                        label="Endangered"
                        active={rarityFilter === 'endangered'}
                        onPress={() => toggleRarity('endangered')}
                      />
                      <FilterChip
                        label="Not endangered"
                        active={rarityFilter === 'not_endangered'}
                        onPress={() => toggleRarity('not_endangered')}
                      />
                    </View>
                  </View>

                  <View style={s.filterBlock}>
                    <Text style={s.filterSubLabel}>Source</Text>
                    <View style={s.filterRow}>
                      <FilterChip
                        label="Camera"
                        active={sourceFilter === 'camera'}
                        onPress={() =>
                          setSourceFilter(prev =>
                            prev === 'camera' ? 'all' : 'camera',
                          )
                        }
                      />
                      <FilterChip
                        label="Library"
                        active={sourceFilter === 'library'}
                        onPress={() =>
                          setSourceFilter(prev =>
                            prev === 'library' ? 'all' : 'library',
                          )
                        }
                      />
                    </View>
                  </View>

                  <View style={s.filterBlock}>
                    <Text style={s.filterSubLabel}>Confidence</Text>
                    <View style={s.filterRow}>
                      {CONFIDENCE_OPTIONS.map(value => (
                        <FilterChip
                          key={value}
                          label={value === 0 ? 'Any confidence' : `≥${value}%`}
                          active={minConfidence === value}
                          onPress={() =>
                            setMinConfidence(prev =>
                              prev === value ? 0 : value,
                            )
                          }
                        />
                      ))}
                    </View>
                  </View>

                  <View style={s.filterBlock}>
                    <Text style={s.filterSubLabel}>Species Type</Text>
                    <View style={[s.dropdown, s.speciesDropdown]}>
                      <Pressable
                        style={s.pickerButton}
                        onPress={() => {
                          setSpeciesMenuVisible(v => !v);
                          setSortMenuVisible(false);
                        }}
                        android_ripple={{color: '#00000014'}}>
                        <Text style={s.pickerButtonText}>
                          {SPECIES_OPTIONS.find(o => o.key === speciesFilter)
                            ?.label ?? 'All species'}
                        </Text>
                        <Text
                          style={[
                            s.pickerButtonChevron,
                            !speciesMenuVisible && s.caretFlipped,
                          ]}>
                          ^
                        </Text>
                      </Pressable>
                      {speciesMenuVisible ? (
                        <View
                          style={[s.dropdownMenu, s.speciesDropdownMenu]}>
                          {SPECIES_OPTIONS.map(option => {
                            const active = speciesFilter === option.key;
                            return (
                              <Pressable
                                key={option.key}
                                style={[
                                  s.dropdownItem,
                                  active && s.dropdownItemActive,
                                ]}
                                onPress={() => {
                                  setSpeciesFilter(option.key);
                                  setSpeciesMenuVisible(false);
                                }}
                                android_ripple={{color: '#00000010'}}>
                                <Text
                                  style={[
                                    s.dropdownItemText,
                                    active && s.dropdownItemTextActive,
                                  ]}>
                                  {option.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <View style={s.filterBlock}>
                    <Text style={s.filterSubLabel}>Date range</Text>
                    <View style={s.filterRow}>
                      <FilterChip
                        label="Any time"
                        active={!dateRange.start && !dateRange.end}
                        onPress={clearDateRange}
                      />
                    </View>
                    <View style={s.dateRow}>
                      <Pressable
                        style={s.dateButton}
                        onPress={() => openDatePicker('start')}
                        android_ripple={{color: '#00000010'}}>
                        <Text style={s.dateButtonLabel}>From</Text>
                        <Text style={s.dateButtonValue}>
                          {dateRange.start
                            ? formatDateOnly(dateRange.start)
                            : 'Select date'}
                        </Text>
                      </Pressable>
                      <Pressable
                        style={s.dateButton}
                        onPress={() => openDatePicker('end')}
                        android_ripple={{color: '#00000010'}}>
                        <Text style={s.dateButtonLabel}>To</Text>
                        <Text style={s.dateButtonValue}>
                          {dateRange.end
                            ? formatDateOnly(dateRange.end)
                            : 'Select date'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </>
              ) : null}
            </View>

            <View style={s.filterGroup}>
              <Text style={s.filterLabel}>Sort by</Text>
              <View style={[s.dropdown, s.sortDropdown]}>
                <Pressable
                  style={s.pickerButton}
                  onPress={() => {
                    setSortMenuVisible(v => !v);
                    setSpeciesMenuVisible(false);
                  }}
                  android_ripple={{color: '#00000014'}}>
                  <Text style={s.pickerButtonText}>
                    {SORT_OPTIONS.find(o => o.key === sort)?.label ?? 'Select'}
                  </Text>
                  <Text
                    style={[
                      s.pickerButtonChevron,
                      !sortMenuVisible && s.caretFlipped,
                    ]}>
                    ^
                  </Text>
                </Pressable>
                {sortMenuVisible ? (
                  <View style={s.dropdownMenu}>
                    {SORT_OPTIONS.map(option => {
                      const active = sort === option.key;
                      return (
                        <Pressable
                          key={option.key}
                          style={[
                            s.dropdownItem,
                            active && s.dropdownItemActive,
                          ]}
                          onPress={() => {
                            setSort(option.key);
                            setSortMenuVisible(false);
                          }}
                          android_ripple={{color: '#00000010'}}>
                          <Text
                            style={[
                              s.dropdownItemText,
                              active && s.dropdownItemTextActive,
                            ]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>

            <Text style={s.resultCount}>
              {results.length} {resultWord}
            </Text>
            <Text style={s.feedTitle}>{showForYou ? 'For You' : 'Results'}</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No plants found</Text>
            <Text style={s.emptySubtitle}>
              Try adjusting your search or filter selections.
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const FilterChip = React.memo(({label, active, onPress}) => (
  <Pressable
    onPress={onPress}
    style={[s.chipBase, active && s.chipBaseActive]}
    android_ripple={{color: '#00000014'}}>
    <Text style={[s.chipBaseText, active && s.chipBaseTextActive]}>{label}</Text>
  </Pressable>
));

FilterChip.displayName = 'FilterChip';

const s = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  listContent: {paddingBottom: 48},
  header: {paddingHorizontal: 16, paddingTop: 28, paddingBottom: 16, gap: 12},
  title: {fontSize: 26, fontWeight: 'bold', color: '#1F2A37'},
  subtitle: {color: '#475569', lineHeight: 20},
  searchBox: {
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  input: {flex: 1, color: '#1F2937', fontSize: 15},
  filterGroup: {gap: 12},
  filterGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterBlock: {gap: 8},
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterToggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2F6C4F',
  },
  caretFlipped: {
    transform: [{scaleY: -1}],
  },
  filterRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chipBase: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#DDEEE6',
    borderWidth: 1,
    borderColor: '#B4D6C3',
  },
  chipBaseActive: {
    backgroundColor: '#2F6C4F',
    borderColor: '#2F6C4F',
  },
  chipBaseText: {color: '#2F6C4F', fontWeight: '700'},
  chipBaseTextActive: {color: '#FFFFFF'},
  resultCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  feedTitle: {fontSize: 20, fontWeight: '800', color: '#1F2A37', marginTop: 4},
  dropdown: {position: 'relative'},
  speciesDropdown: {zIndex: 12},
  // speciesDropdownMenu overrides so it behaves like an expanding section,
  // not a floating overlay, so the whole screen scrolls instead.
  speciesDropdownMenu: {
    position: 'relative',
    top: 0,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  sortDropdown: {zIndex: 10},
  pickerButton: {
    height: 46,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7FCF9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A9D6BC',
  },
  pickerButtonText: {color: '#1F2937', fontWeight: '700'},
  pickerButtonChevron: {color: '#2F6C4F', fontSize: 22, fontWeight: '700'},
  dateRow: {flexDirection: 'row', gap: 12},
  dateButton: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A9D6BC',
    backgroundColor: '#F7FCF9',
    gap: 4,
    justifyContent: 'center',
  },
  dateButtonLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dateButtonValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  post: {
    width: '100%',
    marginBottom: 36,
    backgroundColor: '#FFFFFF',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  userInfo: {flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1},
  userBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#D8E9DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBadgeText: {fontSize: 15, fontWeight: '700', color: '#24543B'},
  username: {fontSize: 15, fontWeight: '700', color: '#1F2A37'},
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#2F6C4F',
  },
  viewButtonText: {color: '#FFFFFF', fontWeight: '700', fontSize: 13},
  imageWrap: {backgroundColor: '#CBD5F5'},
  postImage: {
    width: '100%',
    aspectRatio: 1,
  },
  postBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  postTitle: {fontSize: 17, fontWeight: '800', color: '#0F172A'},
  postMeta: {fontSize: 13.5, fontWeight: '600', color: '#334155'},
  postTimestamp: {fontSize: 12.5, fontWeight: '600', color: '#64748B'},
  emptyState: {
    marginTop: 32,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {fontSize: 16, fontWeight: '800', color: '#1F2937'},
  emptySubtitle: {fontSize: 13, color: '#6B7280', textAlign: 'center'},
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D3E6DB',
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
    zIndex: 10,
    marginTop: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownItemActive: {
    backgroundColor: '#E4F1EA',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#2F6C4F',
  },
  iosModalOverlay: {
    flex: 1,
    backgroundColor: '#00000055',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iosModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    gap: 18,
  },
  iosModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iosModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  iosModalClose: {
    padding: 6,
    borderRadius: 999,
  },
  iosModalCloseText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#94A3B8',
  },
  iosModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#A9D6BC',
    backgroundColor: '#F7FCF9',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2F6C4F',
  },
  modalButtonPrimary: {
    backgroundColor: '#2F6C4F',
    borderColor: '#2F6C4F',
  },
  modalButtonPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iosDatePicker: {alignSelf: 'stretch'},
});
