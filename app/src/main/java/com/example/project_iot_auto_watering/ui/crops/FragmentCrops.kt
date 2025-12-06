package com.example.project_iot_auto_watering.ui.crops

import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.widget.PopupMenu
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.fragment.app.Fragment
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.fragment.findNavController
import com.bumptech.glide.Glide
import com.example.project_iot_auto_watering.MainViewModel
import com.example.project_iot_auto_watering.MainViewModelFactory
import android.Manifest
import android.app.Dialog
import android.content.Context
import android.content.Intent
import android.content.res.ColorStateList
import android.os.CountDownTimer
import android.util.Log
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.widget.AppCompatButton
import androidx.lifecycle.VIEW_MODEL_STORE_OWNER_KEY
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.request.DurationManual
import com.example.project_iot_auto_watering.data.model.request.EspDeviceRequest
import com.example.project_iot_auto_watering.data.model.request.ModeIrrigation
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.GardenInfo
import com.example.project_iot_auto_watering.data.repository.GardenRepository
import com.example.project_iot_auto_watering.data.repository.MainRepository
import com.example.project_iot_auto_watering.data.retrofit.RetrofitInstance
import com.example.project_iot_auto_watering.databinding.FragmentDetailCropBinding
import com.example.project_iot_auto_watering.service.IrrigationForegroundService
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenVMFactory
import com.example.project_iot_auto_watering.ui.home.viewmodel.GardenViewModel
import com.example.project_iot_auto_watering.util.NavOption
import com.example.project_iot_auto_watering.util.ObjectUtils
import kotlinx.coroutines.launch
import java.io.File

class FragmentCrops : Fragment(), View.OnClickListener, AddDevice {
    private var _binding: FragmentDetailCropBinding? = null
    private val binding get() = _binding!!
    private lateinit var popupMenu: PopupMenu

    private lateinit var popupMenuMode: PopupMenu
    private lateinit var mainViewModel: MainViewModel
    private val mainRepository = MainRepository(RetrofitInstance.api)

    private lateinit var gardenViewModel: GardenViewModel
    private val gardenRepository = GardenRepository(RetrofitInstance.api)
    private lateinit var photoUri: Uri

    private var tokenAuth = ""

    private var stateWatering = false

    private var durationManual = 0


    //lấy kết quả từ camera/gallery
    private val takePictureLauncher =
        registerForActivityResult(ActivityResultContracts.TakePicture()) { success ->
            if (success) {
                Glide.with(this)
                    .load(photoUri)
                    .skipMemoryCache(true)
                    .diskCacheStrategy(DiskCacheStrategy.NONE)
                    .into(binding.imgCrops)
            }
        }

    //permission
    private val requestCameraPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (granted) {
                openCamera()
            } else {
                Toast.makeText(requireContext(), "Gallery permission denied", Toast.LENGTH_SHORT)
                    .show()
            }
        }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentDetailCropBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        initViewModel()
        tokenAuth = requireContext().getSharedPreferences("Auth", Context.MODE_PRIVATE)
            .getString("token", "").toString()

        binding.tvTime.text= ObjectUtils.nextTimeWatering
        initMenuPopup()
        initMenuModePopup()

        //lấy trạng thái bơm khi mới vào ứng dụng
        getStateIrrigation()
        //
        getModeIrrigation()

        getPictureGarden()
        initListener()
        initObserve()

    }

    private fun initMenuPopup() {
        popupMenu = PopupMenu(requireContext(), binding.imgMenu)
        popupMenu.menuInflater.inflate(R.menu.menu_fragment_crops, popupMenu.menu)
        popupMenu.setOnMenuItemClickListener {
            when (it.itemId) {
                R.id.history -> {
                    findNavController().navigate(
                        R.id.action_fragmentCrops_to_fragmentHistory, null,
                        NavOption.animationFragment
                    )
                }

                R.id.bindSensor -> {
                    FragmentDialogAddDevice(this).show(parentFragmentManager, "DialogDevice")
                }

                R.id.changePicture -> {
                    checkPermissionCameraAndOpen()
                }

                R.id.delete -> {
                    gardenViewModel.deleteGarden(gardenViewModel.idGarden,tokenAuth){isState->
                        if(isState){
                            Toast.makeText(requireContext(),"Xóa thành công!", Toast.LENGTH_SHORT).show()
                            lifecycleScope.launch {
                                deleteImg()
                            }
                            findNavController().popBackStack()
                        }
                        else{
                            Toast.makeText(requireContext(),"Xóa thất bại!", Toast.LENGTH_SHORT).show()
                        }
                    }
                }
            }
            true
        }
    }

    private fun initMenuModePopup() {
        popupMenuMode = PopupMenu(requireContext(), binding.imgDrop)
        popupMenuMode.menuInflater.inflate(R.menu.menu_mode_watering, popupMenuMode.menu)
        popupMenuMode.setOnMenuItemClickListener {
            val gardenId = gardenViewModel.idGarden
            if (gardenViewModel.espId == "-1") {
                Toast.makeText(requireContext(), "Vui lòng gắn cảm biến trước!", Toast.LENGTH_SHORT)
                    .show()
            } else {
                when (it.itemId) {
                    R.id.manual -> {
                        //api update chế độ
                        binding.tvModeSpecific.text = getString(R.string.manual)
                        gardenViewModel.updateIrrigationMode(
                            gardenId,
                            ModeIrrigation(getString(R.string.manual_be)),
                            tokenAuth
                        )
                    }

                    R.id.schedule -> {
                        binding.tvModeSpecific.text = getString(R.string.schedule)
                        gardenViewModel.updateIrrigationMode(
                            gardenId,
                            ModeIrrigation(getString(R.string.schedule_water_be)),
                            tokenAuth
                        )
                    }

                    R.id.auto -> {
                        gardenViewModel.updateIrrigationMode(
                            gardenId,
                            ModeIrrigation(getString(R.string.auto_backend)),
                            tokenAuth
                        )
                        binding.tvModeSpecific.text = getString(R.string.auto)
                    }
                }
            }
            true
        }
    }

    private fun initListener() {
        binding.iconBack.setOnClickListener(this)
        binding.img1.setOnClickListener(this)
        binding.img3.setOnClickListener(this)
        binding.img2.setOnClickListener(this)
        binding.imgMenu.setOnClickListener(this)
        binding.imgDrop.setOnClickListener(this)

    }

    override fun onClick(p0: View?) {
        when (p0?.id) {
            R.id.icon_back -> {
                findNavController().popBackStack()
            }

            R.id.img_3 -> {
                findNavController().navigate(
                    R.id.action_fragmentCrops_to_fragmentSetting, null,
                    NavOption.animationFragment
                )
            }

            R.id.img_2 -> {
                findNavController().navigate(
                    R.id.action_fragmentCrops_to_fragmentDocument, null,
                    NavOption.animationFragment
                )
            }

            R.id.img_1 -> {
                val gardenId = gardenViewModel.idGarden
                if (stateWatering) {
                    gardenViewModel.stopIrrigation(gardenId, tokenAuth) { m ->
                        if (m != "") {
                            stopPumpNotification()
                            binding.tvState.text = m
                            stateWatering = false
                            setViewPumpOff()
                        }
                        Toast.makeText(requireContext(), m, Toast.LENGTH_SHORT).show()
                    }
                } else {
                    //thêm dialog xác nhận tưới (nếu cần)
                    val dialog= Dialog(requireContext())
                    dialog.setContentView(R.layout.dialog_set_duration)
                    val btnOk=dialog.findViewById<AppCompatButton>(R.id.btn_ok)
                    val btnCancel=dialog.findViewById<AppCompatButton>(R.id.btn_cancel)
                    btnOk.setOnClickListener {
                        durationManual=dialog.findViewById<EditText>(R.id.edt_input).text.toString().toInt()
                        startIrrigation(gardenId)
                        dialog.dismiss()
                    }
                    btnCancel.setOnClickListener {
                        dialog.dismiss()
                    }
                    dialog.setCancelable(false)
                    dialog.setCanceledOnTouchOutside(false)
                    dialog.window?.setLayout(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT
                    )
                    dialog.show()
                }
            }

            R.id.img_menu -> {
                popupMenu.show()
            }

            R.id.img_drop -> {
                popupMenuMode.show()
            }

        }
    }

    private fun initViewModel() {
        mainViewModel = ViewModelProvider(
            requireActivity(),
            MainViewModelFactory(mainRepository)
        )[MainViewModel::class.java]
        binding.tvNameCrop.text = mainViewModel.nameGarden

        gardenViewModel = ViewModelProvider(
            requireActivity(),
            GardenVMFactory(gardenRepository)
        )[GardenViewModel::class.java]

    }

    private fun checkPermissionCameraAndOpen() {
        val permission = Manifest.permission.CAMERA
        if (ContextCompat.checkSelfPermission(
                requireContext(),
                permission
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            openCamera()
        } else {
            requestCameraPermission.launch(permission)
        }
    }

    private fun openCamera() {
        val photoFile = File(
            requireContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES),
            "${mainViewModel.nameGarden}.jpg"
        )
//trước android 7+ dùng trực tiếp file://
        photoUri = FileProvider.getUriForFile(
            requireContext(),
            "${requireContext().packageName}.fileprovider",
            photoFile
        )
        takePictureLauncher.launch(photoUri)
    }

    private fun deleteImg() {
        val dir = requireContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        val file = File(dir, "${mainViewModel.nameGarden}.jpg")

        if (file.exists()) {
            val deleted = file.delete()
            Log.d("DeleteImg", "Xoá file: $deleted - ${file.absolutePath}")
        } else {
            Log.d("DeleteImg", "File không tồn tại: ${file.absolutePath}")
        }
    }


    private fun getPictureGarden() {
        val picturesDir = requireContext().getExternalFilesDir(Environment.DIRECTORY_PICTURES)
        val photoFile = File(picturesDir, "${mainViewModel.nameGarden}.jpg")
        if (!photoFile.exists()) {
            Toast.makeText(context, "File không tồn tại", Toast.LENGTH_SHORT).show()
            return
        }
        //đường dẫn .fileprovider để bảo mật hơn
        val photoUri = FileProvider.getUriForFile(
            requireContext(),
            "com.example.project_iot_auto_watering.fileprovider",
            photoFile
        ).buildUpon()
            .appendQueryParameter("t", System.currentTimeMillis().toString())
            .build()

        Glide.with(this)
            .load(photoUri)
            .into(binding.imgCrops)
    }

    override fun getIdDevice(idDevice: String) {
        val idGarden = gardenViewModel.idGarden
        val esp = EspDeviceRequest(idDevice)
        val tokenAuth = requireContext().getSharedPreferences("Auth", Context.MODE_PRIVATE)
            .getString("token", "").toString()
        gardenViewModel.updateDevice(idGarden, esp, tokenAuth) { m ->
            Toast.makeText(requireContext(), m, Toast.LENGTH_SHORT).show()
        }
    }

    private fun initObserve() {
        gardenViewModel.listEspDevice.observe(viewLifecycleOwner) { list ->
            var espDevice = DataEspAll("-1", 0.0f, 0.0f, 0.0f, "", false, GardenInfo(-1, ""))
            for (e in list) {
                if (e.garden.id == gardenViewModel.idGarden) {
                    espDevice = e
                    break
                }
            }
            binding.tvResultHumidity.text = espDevice.airHumidity.toString()
            binding.tvResultTempe.text = espDevice.temperature.toString()
            binding.tvResultSoil.text = espDevice.soilMoisture.toString()
        }
        gardenViewModel.modeIrrigation.observe(viewLifecycleOwner) { mode ->
            if (mode == "manual") {
                binding.tvModeSpecific.text = getString(R.string.manual)
            }
            if (mode == "schedule") {
                binding.tvModeSpecific.text = getString(R.string.schedule)
            }
            if (mode == "auto") {
                binding.tvModeSpecific.text = getString(R.string.auto)
            }
        }
        gardenViewModel.pumpStatus.observe(viewLifecycleOwner){pumpStatus->
            if(pumpStatus.pumpStatus=="on"){
                binding.tvState.text="Vườn đang tưới"
                setViewPumpOn()
            }
            else{
                binding.tvState.text="Hãy tưới nước cho cây"
                setViewPumpOff()
            }
        }

    }

    private fun getModeIrrigation() {
        val gardenId = gardenViewModel.idGarden
        gardenViewModel.getIrrigationMode(gardenId, tokenAuth)
    }

    //lấy trạng thái máy bơm
    private fun getStateIrrigation() {
        lifecycleScope.launch {
            gardenViewModel.getPumpStatus(gardenViewModel.idGarden,tokenAuth){

            }
        }
    }

    private fun startIrrigation(gardenId:Int){
        binding.progressBar.visibility=View.VISIBLE
        Toast.makeText(requireContext(),"Vui lòng đợi máy bơm bật nhé :))", Toast.LENGTH_SHORT).show()
        binding.img1.setOnClickListener(null)
        gardenViewModel.startIrrigation(
            gardenId,
            DurationManual(durationManual),
            tokenAuth
        ) { m ->
            binding.progressBar.visibility=View.GONE
            Toast.makeText(requireContext(), m, Toast.LENGTH_SHORT).show()
            if (m != "") {
                startRunDuration(durationManual*60,binding.tvCountDown)
                stateWatering = true
                setViewPumpOn()
            }
            binding.tvState.text = m
            startPumpNotification(gardenId)
            Toast.makeText(requireContext(),"Vui lòng nhập thời gian hợp lệ", Toast.LENGTH_SHORT).show()
            binding.img1.setOnClickListener(this)
        }
    }

    private fun startPumpNotification(gardenId: Int){
        val intent= Intent(requireContext(), IrrigationForegroundService::class.java).apply {
            putExtra("gardenId",gardenId)
            putExtra("name", mainViewModel.nameGarden)
        }
        requireContext().startForegroundService(intent)
    }

    private fun stopPumpNotification(){
        val intent = Intent(requireContext(), IrrigationForegroundService::class.java)
        requireContext().stopService(intent)
    }

    private fun startRunDuration(totalSecond:Int,tvCountDown: TextView){
        val totalMillis=totalSecond*1000L
        if(totalSecond>3600){

            val timer=object: CountDownTimer(totalMillis,1000){
                override fun onFinish() {
                    tvCountDown.text="00:00"
                }

                override fun onTick(millisUntilFinished: Long) {
                    val hours=millisUntilFinished/1000/3600
                    val minutes=(millisUntilFinished/1000%3600)/60
                    val seconds=millisUntilFinished/1000%60

                    tvCountDown.text= String.format("%02d:%02d:%02d", hours, minutes, seconds)
                }
            }
            timer.start()
        }
        else{
            val timer=object: CountDownTimer(totalMillis,1000){
                override fun onFinish() {
                    tvCountDown.text="00:00"
                }
                override fun onTick(millisUntilFinished: Long) {
                    val minutes=millisUntilFinished/1000/60
                    val seconds=millisUntilFinished/1000%60

                    tvCountDown.text= String.format("%02d:%02d", minutes, seconds)
                }
            }
            timer.start()
        }
    }

    private fun setViewPumpOn(){
        val color = ContextCompat.getColor(requireContext(), R.color.blue_watering)
        binding.img1.setBackgroundColor(color)
        binding.imgSprinkler.imageTintList =
            ColorStateList.valueOf(ContextCompat.getColor(requireContext(), R.color.blue_watering))
    }

    private fun setViewPumpOff(){
        val color = ContextCompat.getColor(requireContext(), R.color.black_off)
        binding.tvSprinkler.setTextColor(color)
        binding.imgSprinkler.imageTintList=
            ColorStateList.valueOf(ContextCompat.getColor(requireContext(), R.color.black_off))
    }


}