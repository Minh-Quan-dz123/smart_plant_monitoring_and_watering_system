package com.example.project_iot_auto_watering.ui.setting

import android.annotation.SuppressLint
import android.app.DatePickerDialog
import android.app.TimePickerDialog
import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TimePicker
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.PopupMenu
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.request.ScheduleBody
import com.example.project_iot_auto_watering.data.model.request.ScheduleBodyUpdate
import com.example.project_iot_auto_watering.data.model.response.ScheduleDTO
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import com.example.project_iot_auto_watering.data.repository.ScheduleRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentSettingBinding
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenVMFactory
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenViewModel
import com.example.project_iot_auto_watering.ui.setting.adapter.AdapterSchedule
import com.example.project_iot_auto_watering.ui.setting.adapter.OnClickIcon
import com.example.project_iot_auto_watering.ui.setting.adapter.checkRepeat
import com.example.project_iot_auto_watering.ui.setting.viewmodel.ScheduleVMFactory
import com.example.project_iot_auto_watering.ui.setting.viewmodel.ScheduleViewModel
import com.example.project_iot_auto_watering.util.ObjectUtils
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.time.Instant
import java.time.ZoneId
import java.util.Calendar
import java.util.Locale
import kotlin.math.min

class FragmentSetting : Fragment(), View.OnClickListener, OnClickIcon {
    private var _binding: FragmentSettingBinding? = null
    private val binding get() = _binding!!
    private lateinit var timePicker: TimePickerDialog
    private lateinit var datePicker: DatePickerDialog
    private lateinit var popupMenuDuration: PopupMenu
    private lateinit var popupMenuRepeat: PopupMenu
    private lateinit var scheduleViewModel: ScheduleViewModel
    private val scheduleRepository = ScheduleRepository(RetrofitInstance.api)
    private val gardenRepository = GardenRepository(RetrofitInstance.api)
    private lateinit var viewModelGarden: GardenViewModel
    private lateinit var adapterSchedule: AdapterSchedule
    private lateinit var rcvSchedule: RecyclerView

    private var tokenAuth: String? = null
    private var dateFromSchedule = ""
    private var timeFromSchedule = ""
    private var repeatFromSchedule = ""
    private var durationFromSchedule = 0
    private var idGarden = -1
    private var idSchedule = -1

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        _binding = FragmentSettingBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        tokenAuth = requireContext().getSharedPreferences("Auth", Context.MODE_PRIVATE)
            .getString("token", "")

        //setup time and date
        setupTime()
        setupDate()
        setupPopupDuration()
        setupPopupRepeat()

        initViewModel()
        initAdapter()
        initObserve()
        initListener()

        idGarden = viewModelGarden.idGarden
        fetchDataSchedule()


    }

    private fun initAdapter() {
        rcvSchedule = binding.rcvLich
        adapterSchedule = AdapterSchedule(this)
        rcvSchedule.layoutManager = LinearLayoutManager(requireContext())
        rcvSchedule.adapter = adapterSchedule
    }

    private fun initObserve() {
        scheduleViewModel.listSchedule.observe(viewLifecycleOwner) { list ->
            if(list.isNotEmpty()){
                Log.d("DEBUG",list.toString())
                periodOfTimeFromNow(list[0].date,list[0].time)
            }
            adapterSchedule.submitList(list)
        }
    }

    private fun initListener() {
        binding.iconBack.setOnClickListener(this)
        binding.imgDate.setOnClickListener(this)
        binding.imgRepeat.setOnClickListener(this)
        binding.imgTime.setOnClickListener(this)
        binding.btnSave.setOnClickListener(this)
        binding.imgDuration.setOnClickListener(this)

    }

    override fun onClick(p0: View?) {

        when (p0?.id) {
            R.id.img_date -> {
                datePicker.show()
            }

            R.id.img_time -> {
                timePicker.show()
            }

            R.id.img_repeat -> {
                popupMenuRepeat.show()
            }

            R.id.icon_back -> {
                findNavController().popBackStack()
            }

            R.id.img_duration -> {
                popupMenuDuration.show()
            }

            R.id.btn_save -> {
                getData()
                checkInputValid(
                    dateFromSchedule,
                    timeFromSchedule,
                    repeatFromSchedule,
                    durationFromSchedule
                ) { condition, message ->
                    if (condition) {
                        val scheduleBody = ScheduleBodyUpdate(
                            dateFromSchedule,
                            timeFromSchedule,
                            durationFromSchedule,
                            repeatFromSchedule,
                        )
                        val scheduleBodyC= ScheduleBody( dateFromSchedule,
                            timeFromSchedule,
                            durationFromSchedule,
                            repeatFromSchedule,
                            idGarden)

                        if (scheduleViewModel.checkSchedule(dateFromSchedule, timeFromSchedule)) {
                            if (idSchedule != -1) {
                                Log.d("checkinput","$dateFromSchedule|$timeFromSchedule|$repeatFromSchedule|$durationFromSchedule")
                                saveSchedule(scheduleBody)
                            } else {
                                Log.d("checkinput","$dateFromSchedule|$timeFromSchedule|$repeatFromSchedule|$durationFromSchedule")
                                addSchedule(scheduleBodyC)
                            }
                        } else {
                            Toast.makeText(
                                requireContext(),
                                "Trùng lịch trong danh sách",
                                Toast.LENGTH_SHORT
                            ).show()
                        }

                    } else {
                        Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show()
                    }
                }


            }
        }
    }

    private fun setupTime() {
        val now = Calendar.getInstance()
        timePicker = TimePickerDialog(
            requireContext(), { _, hourOfDay, minute ->
                val time=String.format(Locale.getDefault(), format = "%02d:%02d",hourOfDay,minute)
                binding.tvTime.text = time
            }, now.get(Calendar.HOUR_OF_DAY),
            now.get(Calendar.MINUTE),
            true
        )
    }

    private fun setupDate() {
        val calendar = Calendar.getInstance()
        datePicker = DatePickerDialog(
            requireContext(),
            { _, year, month, dayOfMonth ->
                val date = String.format(
                    Locale.getDefault(),
                    "%04d-%02d-%02d",
                    year,
                    month + 1,
                    dayOfMonth
                )
                binding.tvDate.text = date
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        )
    }

    @SuppressLint("SetTextI18n")
    private fun setupPopupDuration() {
        popupMenuDuration = PopupMenu(requireContext(), binding.imgDuration)
        popupMenuDuration.menuInflater.inflate(R.menu.menu_unit_time, popupMenuDuration.menu)
        popupMenuDuration.setOnMenuItemClickListener {
            when (it.itemId) {
                R.id.hour -> {
                    binding.unit.text = "giờ"
                }

                R.id.minute -> {
                    binding.unit.text = "phút"
                }

                R.id.second -> {
                    binding.unit.text = "giây"
                }
            }
            true
        }
    }

    @SuppressLint("SetTextI18n")
    private fun setupPopupRepeat() {
        popupMenuRepeat = PopupMenu(requireContext(), binding.imgRepeat)
        popupMenuRepeat.menuInflater.inflate(R.menu.menu_repeat, popupMenuRepeat.menu)
        popupMenuRepeat.setOnMenuItemClickListener {
            when (it.itemId) {
                R.id._no -> {
                    binding.tvRepeat.text = "Không"
                }

                R.id._daily -> {
                    binding.tvRepeat.text = "Hàng ngày"
                }

                R.id._week2 -> {
                    binding.tvRepeat.text = "Mỗi thứ 2"
                }

                R.id._week3 -> {
                    binding.tvRepeat.text = "Mỗi thứ 3"
                }

                R.id._week4 -> {
                    binding.tvRepeat.text = "Mỗi thứ 4"
                }

                R.id._week5 -> {
                    binding.tvRepeat.text = "Mỗi thứ 5"
                }

                R.id._week6 -> {
                    binding.tvRepeat.text = "Mỗi thứ 6"
                }

                R.id._week7 -> {
                    binding.tvRepeat.text = "Mỗi thứ 7"
                }

                R.id._week8 -> {
                    binding.tvRepeat.text = "Mỗi chủ nhật"
                }
            }
            true
        }
    }

    private fun initViewModel() {
        scheduleViewModel = ViewModelProvider(
            requireActivity(),
            ScheduleVMFactory(scheduleRepository)
        )[ScheduleViewModel::class.java]

        viewModelGarden = ViewModelProvider(
            requireActivity(),
            GardenVMFactory(gardenRepository)
        )[GardenViewModel::class.java]
    }

    override fun onClickIconEdit(scheduleDTO: ScheduleDTO) {
        idGarden = scheduleDTO.gardenId
        idSchedule = scheduleDTO.id
        val instant= Instant.parse(scheduleDTO.date)
        val date=instant.atZone(ZoneId.systemDefault()).toLocalDate()
        binding.tvDate.text = date.toString()
        binding.tvTime.text = scheduleDTO.time
        binding.tvDuration.setText(scheduleDTO.durationSeconds.toString())
        binding.tvRepeat.text = checkRepeat(scheduleDTO.repeat)
    }

    override fun onClickIconRemove(idSchedule: Int) {
        val dialogConfirm = AlertDialog.Builder(requireContext())
            .setTitle("Xóa")
            .setMessage("Bạn có chắc chắn xóa không?")
            .setPositiveButton("Có") { _, _ ->
                lifecycleScope.launch {
                    scheduleViewModel.deleteSchedule(
                        idSchedule,
                        tokenAuth.toString()
                    ) { }
                }
            }
            .setNegativeButton("Không", null)
        dialogConfirm.show()
    }

    private fun saveSchedule(body: ScheduleBodyUpdate) {
        scheduleViewModel.updateSchedule(idGarden, idSchedule, body, tokenAuth.toString()) { m ->
            if (m == "success") {
                refreshData()
            }
            Toast.makeText(requireContext(), m, Toast.LENGTH_SHORT).show()
        }
    }

    private fun addSchedule(body: ScheduleBody) {
        Log.d("DEBUG_addSchedule",body.toString())
        scheduleViewModel.createSchedule(idGarden, body, tokenAuth.toString()) { m ->
            if (m == "success") {
                refreshData()
            }
            Toast.makeText(requireContext(), m, Toast.LENGTH_SHORT).show()
        }
    }

    private fun getData() {
        dateFromSchedule = binding.tvDate.text.toString()
        timeFromSchedule = binding.tvTime.text.toString()
        val valueRepeatTmp = binding.tvRepeat.text.toString()
        Log.d("DEBUG_GET_DATA",valueRepeatTmp)
        when (valueRepeatTmp) {
            "Không" -> repeatFromSchedule = "once"
            "Hàng ngày" -> repeatFromSchedule = "daily"
            "Mỗi thứ 2" -> repeatFromSchedule = "week:0"
            "Mỗi thứ 3" -> repeatFromSchedule = "week:1"
            "Mỗi thứ 4" -> repeatFromSchedule = "week:2"
            "Mỗi thứ 5" -> repeatFromSchedule = "week:3"
            "Mỗi thứ 6" -> repeatFromSchedule = "week:4"
            "Mỗi thứ 7" -> repeatFromSchedule = "week:5"
            "Mỗi chủ nhật" -> repeatFromSchedule = "week:6"
        }

        val unitDuration = binding.unit.text.toString()
        if(binding.tvDuration.text.toString()!=""){
            when (unitDuration) {
                "giờ" -> {
                    durationFromSchedule = binding.tvDuration.text.toString().toInt() * 3600
                }

                "phút" -> {
                    durationFromSchedule = binding.tvDuration.text.toString().toInt() * 60
                }

                "giây" -> {
                    durationFromSchedule = binding.tvDuration.text.toString().toInt()
                }
            }
        }
        else{
            Toast.makeText(requireContext(),"Vui lòng nhập thời gian >1", Toast.LENGTH_SHORT).show()
            return
        }
    }

    private fun fetchDataSchedule() {
        scheduleViewModel.getScheduleGarden(idGarden, tokenAuth.toString()) { }
        Log.d("DEBUG", "id garden gửi lên = $idGarden")
    }


    @SuppressLint("SetTextI18n")
    private fun refreshData() {
        idSchedule = -1
        binding.tvDate.text = ""
        binding.tvTime.text = ""
        binding.tvRepeat.text = "Không"
        binding.tvDuration.setText("")
    }

    private fun periodOfTimeFromNow(date: String, time: String) {
        val instant = Instant.parse(date)
        val dateConvert = instant.atZone(ZoneId.systemDefault()).toLocalDate()
        val dateTime = "$dateConvert $time"
        val sdf = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault())
        val dateObj = sdf.parse(dateTime)
        val timeMillis = dateObj?.time ?: 0L
        val now = System.currentTimeMillis()
        val diffMillis = timeMillis - now

        if (diffMillis <= 0) {
            println("Đã quá thời gian")
            return
        }

        val seconds = diffMillis / 1000
        val minutes = seconds / 60
        val hours = minutes / 60
        val days = hours / 24

        val remHours = hours % 24
        val remMinutes = minutes % 60

        if(days>0){
            ObjectUtils.nextTimeWatering="$days ngày"
        }
        else if(remHours>0){
            ObjectUtils.nextTimeWatering="$remHours giờ"
        }
        else{
            ObjectUtils.nextTimeWatering="$remMinutes phút"
        }
    }
}